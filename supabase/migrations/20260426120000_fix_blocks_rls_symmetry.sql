-- The "dogs visible unless blocked" policy added in 20260425_002_push_blocks
-- intends to be bidirectional: if A blocks B, neither side sees the other's
-- dog. But the inner subquery on public.blocks is itself filtered by the
-- blocks SELECT policy (blocker_id = auth.uid()), so only the blocker sees
-- the row that triggers the hide. The blocked user keeps seeing the blocker's
-- dog -- a real product bug.
--
-- Fix: move the lookup into a security-definer helper that bypasses the inner
-- blocks RLS without widening blocks visibility globally.

create or replace function public.is_blocked_either_way(viewer uuid, owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = viewer and blocked_id = owner)
       or (blocker_id = owner and blocked_id = viewer)
  );
$$;

revoke all on function public.is_blocked_either_way(uuid, uuid) from public;
grant execute on function public.is_blocked_either_way(uuid, uuid) to authenticated, service_role;

drop policy if exists "dogs visible unless blocked" on public.dogs;
create policy "dogs visible unless blocked" on public.dogs
  for select using (
    not public.is_blocked_either_way(auth.uid(), owner_id)
  );
