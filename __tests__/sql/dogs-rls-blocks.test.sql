-- Run with: psql "$DB_URL" -f __tests__/sql/dogs-rls-blocks.test.sql
-- Asserts the "dogs visible unless blocked" RLS policy hides BOTH sides of a
-- block relationship from each other. A block is mutual: if A blocks B, A
-- doesn't see B's dog AND B doesn't see A's dog.
\set ON_ERROR_STOP on
\set VERBOSITY verbose

begin;

-- Two test users with one dog each.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-99999999000c', 'authenticated', 'authenticated', 'block-a@example.com', '', now(), '{}', '{"display_name":"BlockA"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-99999999000d', 'authenticated', 'authenticated', 'block-b@example.com', '', now(), '{}', '{"display_name":"BlockB"}', now(), now(), '', '', '', '');

insert into public.dogs (id, owner_id, name, breed, size, energy, primary_photo_url) values
  ('99999999-9999-9999-9999-9999999900c1', '99999999-9999-9999-9999-99999999000c', 'DogA', 'Mix', 'Medium', 'Medium', 'https://example.com/a.jpg'),
  ('99999999-9999-9999-9999-9999999900d1', '99999999-9999-9999-9999-99999999000d', 'DogB', 'Mix', 'Medium', 'Medium', 'https://example.com/b.jpg');

-- Test 1: before any block, both users see each other's dog.
do $$
declare visible boolean;
begin
  set local role authenticated;
  set local request.jwt.claim.sub = '99999999-9999-9999-9999-99999999000c';
  select exists (select 1 from public.dogs where id = '99999999-9999-9999-9999-9999999900d1') into visible;
  if not visible then raise exception 'Pre-block: A should see B''s dog'; end if;

  set local request.jwt.claim.sub = '99999999-9999-9999-9999-99999999000d';
  select exists (select 1 from public.dogs where id = '99999999-9999-9999-9999-9999999900c1') into visible;
  if not visible then raise exception 'Pre-block: B should see A''s dog'; end if;
end $$;
reset role;

-- A blocks B.
insert into public.blocks (blocker_id, blocked_id) values
  ('99999999-9999-9999-9999-99999999000c', '99999999-9999-9999-9999-99999999000d');

-- Test 2: blocker side. A no longer sees B's dog.
do $$
declare visible boolean;
begin
  set local role authenticated;
  set local request.jwt.claim.sub = '99999999-9999-9999-9999-99999999000c';
  select exists (select 1 from public.dogs where id = '99999999-9999-9999-9999-9999999900d1') into visible;
  if visible then raise exception 'Post-block: A (blocker) should not see B''s dog'; end if;
end $$;
reset role;

-- Test 3: blocked side. B also no longer sees A's dog (block is mutual).
do $$
declare visible boolean;
begin
  set local role authenticated;
  set local request.jwt.claim.sub = '99999999-9999-9999-9999-99999999000d';
  select exists (select 1 from public.dogs where id = '99999999-9999-9999-9999-9999999900c1') into visible;
  if visible then raise exception 'Post-block: B (blocked) should not see A''s dog'; end if;
end $$;
reset role;

rollback;
