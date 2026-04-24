-- Core schema: profiles, dogs (with AI video fields), video_jobs, swipes, matches.
-- Messages, reports, blocks come in later migrations.
-- Storage buckets are configured separately (see comments at the bottom).

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "uuid-ossp";

-- ============================================================================
-- Enums
-- ============================================================================
create type dog_size as enum ('Small', 'Medium', 'Large');
create type dog_energy as enum ('Chill', 'Medium', 'High');
create type ai_video_status as enum ('idle', 'pending', 'ready', 'failed');
create type swipe_direction as enum ('like', 'pass');
create type video_job_status as enum ('pending', 'ready', 'failed', 'cancelled');

-- ============================================================================
-- profiles: one row per authenticated user (1:1 with auth.users)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 60),
  photo_url text,
  bio text check (length(bio) <= 280),
  tags text[] not null default '{}',
  -- Plain lat/lng for v1; switch to PostGIS geography later if needed.
  lat double precision,
  lng double precision,
  search_radius_miles integer not null default 5 check (search_radius_miles between 1 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_location_idx on public.profiles (lat, lng);

-- ============================================================================
-- dogs: one signature dog per profile in v1 (enforced by unique constraint)
-- ============================================================================
create table public.dogs (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(name) between 1 and 40),
  breed text not null,
  birthdate date,
  size dog_size not null,
  energy dog_energy not null,
  tags text[] not null default '{}',
  vaccinated boolean not null default false,
  notes text check (length(notes) <= 500),
  -- Photos: array of public URLs. primary_photo_url is the one we feed Fal.ai.
  photos text[] not null default '{}',
  primary_photo_url text,
  -- AI video fields:
  ai_video_url text,
  ai_video_status ai_video_status not null default 'idle',
  ai_video_prompt text,
  ai_video_scenario text,  -- e.g. 'pilot', 'chef', 'surfer'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id) -- one dog per owner in v1
);

create index dogs_owner_idx on public.dogs (owner_id);
create index dogs_video_status_idx on public.dogs (ai_video_status);

-- ============================================================================
-- video_jobs: log every Fal.ai generation attempt for cost + debugging
-- ============================================================================
create table public.video_jobs (
  id uuid primary key default uuid_generate_v4(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  provider text not null default 'fal-minimax-hailuo-02',
  fal_request_id text,  -- the ID returned by Fal when we submit the job
  prompt text not null,
  scenario text not null,
  status video_job_status not null default 'pending',
  cost_cents integer,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index video_jobs_dog_idx on public.video_jobs (dog_id);
create index video_jobs_status_idx on public.video_jobs (status);
create index video_jobs_fal_request_idx on public.video_jobs (fal_request_id);

-- ============================================================================
-- swipes: every left/right swipe between dogs
-- ============================================================================
create table public.swipes (
  id uuid primary key default uuid_generate_v4(),
  swiper_dog_id uuid not null references public.dogs(id) on delete cascade,
  target_dog_id uuid not null references public.dogs(id) on delete cascade,
  direction swipe_direction not null,
  created_at timestamptz not null default now(),
  unique (swiper_dog_id, target_dog_id),
  check (swiper_dog_id <> target_dog_id)
);

create index swipes_swiper_idx on public.swipes (swiper_dog_id);
create index swipes_target_idx on public.swipes (target_dog_id);

-- ============================================================================
-- matches: created when two dogs both swipe 'like' on each other
-- Canonical ordering: dog_a_id < dog_b_id to dedupe (a,b) and (b,a).
-- ============================================================================
create table public.matches (
  id uuid primary key default uuid_generate_v4(),
  dog_a_id uuid not null references public.dogs(id) on delete cascade,
  dog_b_id uuid not null references public.dogs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (dog_a_id, dog_b_id),
  check (dog_a_id < dog_b_id)
);

create index matches_dog_a_idx on public.matches (dog_a_id);
create index matches_dog_b_idx on public.matches (dog_b_id);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger dogs_touch_updated_at
  before update on public.dogs
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Match-creation trigger: when both dogs swipe 'like', insert a match row.
-- ============================================================================
create or replace function public.create_match_on_mutual_like()
returns trigger language plpgsql security definer as $$
declare
  reciprocal_exists boolean;
  ordered_a uuid;
  ordered_b uuid;
begin
  if new.direction <> 'like' then
    return new;
  end if;

  -- Does the target dog already have a 'like' swipe back at the swiper?
  select exists (
    select 1 from public.swipes
    where swiper_dog_id = new.target_dog_id
      and target_dog_id = new.swiper_dog_id
      and direction = 'like'
  ) into reciprocal_exists;

  if reciprocal_exists then
    if new.swiper_dog_id < new.target_dog_id then
      ordered_a := new.swiper_dog_id;
      ordered_b := new.target_dog_id;
    else
      ordered_a := new.target_dog_id;
      ordered_b := new.swiper_dog_id;
    end if;

    insert into public.matches (dog_a_id, dog_b_id)
    values (ordered_a, ordered_b)
    on conflict (dog_a_id, dog_b_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger swipes_create_match_on_mutual_like
  after insert on public.swipes
  for each row execute function public.create_match_on_mutual_like();

-- ============================================================================
-- new-user trigger: auto-create a profiles row when an auth.users row appears.
-- The display_name defaults to the email local-part; user updates it during onboarding.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'New User')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row-Level Security
-- ============================================================================

-- profiles
alter table public.profiles enable row level security;
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);
create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- dogs
alter table public.dogs enable row level security;
create policy "dogs are publicly readable"
  on public.dogs for select
  using (true);
create policy "users insert own dog"
  on public.dogs for insert
  with check (auth.uid() = owner_id);
create policy "users update own dog"
  on public.dogs for update
  using (auth.uid() = owner_id);
create policy "users delete own dog"
  on public.dogs for delete
  using (auth.uid() = owner_id);

-- video_jobs (only the dog's owner can see their job logs)
alter table public.video_jobs enable row level security;
create policy "owners read own video_jobs"
  on public.video_jobs for select
  using (
    exists (
      select 1 from public.dogs
      where dogs.id = video_jobs.dog_id and dogs.owner_id = auth.uid()
    )
  );

-- swipes (you can only see your own swipes)
alter table public.swipes enable row level security;
create policy "users read own swipes"
  on public.swipes for select
  using (
    exists (
      select 1 from public.dogs
      where dogs.id = swipes.swiper_dog_id and dogs.owner_id = auth.uid()
    )
  );
create policy "users insert own swipes"
  on public.swipes for insert
  with check (
    exists (
      select 1 from public.dogs
      where dogs.id = swipes.swiper_dog_id and dogs.owner_id = auth.uid()
    )
  );

-- matches (you can only see matches involving your dog)
alter table public.matches enable row level security;
create policy "users read matches involving own dog"
  on public.matches for select
  using (
    exists (
      select 1 from public.dogs
      where dogs.owner_id = auth.uid()
        and (dogs.id = matches.dog_a_id or dogs.id = matches.dog_b_id)
    )
  );

-- ============================================================================
-- Notes for follow-up migrations:
-- - messages, reports, blocks tables (build-order steps 8 and 10)
-- - Storage buckets 'dog-photos' and 'dog-videos' (configured via Supabase Studio
--   or via the storage API; avoid committing storage seed here to keep migrations idempotent)
-- - Distance computation (haversine SQL function) when search radius is wired up
-- ============================================================================
