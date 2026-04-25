create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index on public.messages (match_id, created_at);
alter table public.messages enable row level security;
create policy "users read messages in own matches" on public.messages
  for select using (
    exists (
      select 1 from matches m
      join dogs d on d.id = m.dog_a_id or d.id = m.dog_b_id
      where m.id = messages.match_id and d.owner_id = auth.uid()
    )
  );
create policy "users insert messages in own matches" on public.messages
  for insert with check (
    sender_id = auth.uid() and
    exists (
      select 1 from matches m
      join dogs d on d.id = m.dog_a_id or d.id = m.dog_b_id
      where m.id = messages.match_id and d.owner_id = auth.uid()
    )
  );

create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  notes text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  check (reporter_id <> target_id)
);
alter table public.reports enable row level security;
create policy "users insert own reports" on public.reports
  for insert with check (reporter_id = auth.uid());
create policy "users read own reports" on public.reports
  for select using (reporter_id = auth.uid());

create table public.blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
create policy "users manage own blocks" on public.blocks
  for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create or replace function public.haversine_miles(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
returns float8
language sql immutable as $$
  select 3958.8 * 2 * asin(
    sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) *
      power(sin(radians(lng2 - lng1) / 2), 2)
    )
  )
$$;

alter publication supabase_realtime add table public.messages;

create view public.moderation_queue as
  select
    r.id as report_id,
    r.reporter_id,
    rp.display_name as reporter_name,
    r.target_id,
    tp.display_name as target_name,
    r.reason,
    r.notes,
    r.status,
    r.created_at
  from public.reports r
  join public.profiles rp on rp.id = r.reporter_id
  join public.profiles tp on tp.id = r.target_id;
