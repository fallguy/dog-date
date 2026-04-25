create table public.push_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_token text not null,
  device_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_token)
);
create index push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;
create policy "users manage own push tokens" on public.push_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "dogs are publicly readable" on public.dogs;
create policy "dogs visible unless blocked" on public.dogs
  for select using (
    not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = dogs.owner_id)
         or (b.blocker_id = dogs.owner_id and b.blocked_id = auth.uid())
    )
  );
