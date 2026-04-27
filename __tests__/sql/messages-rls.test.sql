-- Run with: psql "$DB_URL" -f __tests__/sql/messages-rls.test.sql
-- Asserts messages SELECT/INSERT policies: match participants can read+send,
-- non-participants cannot.
\set ON_ERROR_STOP on
\set VERBOSITY verbose

begin;

-- Three users: A and B form a match; C is a bystander.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-99999999000e', 'authenticated', 'authenticated', 'msg-a@example.com', '', now(), '{}', '{"display_name":"MsgA"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-99999999000f', 'authenticated', 'authenticated', 'msg-b@example.com', '', now(), '{}', '{"display_name":"MsgB"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-9999999900a0', 'authenticated', 'authenticated', 'msg-c@example.com', '', now(), '{}', '{"display_name":"MsgC"}', now(), now(), '', '', '', '');

insert into public.dogs (id, owner_id, name, breed, size, energy, primary_photo_url) values
  ('99999999-9999-9999-9999-9999999900e1', '99999999-9999-9999-9999-99999999000e', 'DogA', 'Mix', 'Medium', 'Medium', 'https://example.com/a.jpg'),
  ('99999999-9999-9999-9999-9999999900f1', '99999999-9999-9999-9999-99999999000f', 'DogB', 'Mix', 'Medium', 'Medium', 'https://example.com/b.jpg'),
  ('99999999-9999-9999-9999-9999999900a1', '99999999-9999-9999-9999-9999999900a0', 'DogC', 'Mix', 'Medium', 'Medium', 'https://example.com/c.jpg');

-- Mutual like → match created by trigger (canonical ordering: a < b ⇒ DogA, DogB).
delete from public.swipes where target_dog_id in (
  '99999999-9999-9999-9999-9999999900e1',
  '99999999-9999-9999-9999-9999999900f1',
  '99999999-9999-9999-9999-9999999900a1'
);
insert into public.swipes (swiper_dog_id, target_dog_id, direction) values
  ('99999999-9999-9999-9999-9999999900e1', '99999999-9999-9999-9999-9999999900f1', 'like'),
  ('99999999-9999-9999-9999-9999999900f1', '99999999-9999-9999-9999-9999999900e1', 'like');

do $$
declare match_id uuid;
begin
  select id into match_id from public.matches
   where dog_a_id = '99999999-9999-9999-9999-9999999900e1'
     and dog_b_id = '99999999-9999-9999-9999-9999999900f1';
  if match_id is null then raise exception 'Setup failed: mutual-like match missing'; end if;
end $$;

-- Test 1: A can SELECT and INSERT messages on the match.
do $$
declare m_id uuid; visible_count integer;
begin
  select id into m_id from public.matches
   where dog_a_id = '99999999-9999-9999-9999-9999999900e1'
     and dog_b_id = '99999999-9999-9999-9999-9999999900f1';

  set local role authenticated;
  set local request.jwt.claim.sub = '99999999-9999-9999-9999-99999999000e';

  insert into public.messages (match_id, sender_id, body)
    values (m_id, '99999999-9999-9999-9999-99999999000e', 'hi from A');

  select count(*) into visible_count from public.messages where match_id = m_id;
  if visible_count < 1 then raise exception 'A should see at least one message'; end if;
end $$;
reset role;

-- Test 2: C (non-participant) cannot SELECT or INSERT.
do $$
declare m_id uuid; visible_count integer; insert_blocked boolean := false;
begin
  select id into m_id from public.matches
   where dog_a_id = '99999999-9999-9999-9999-9999999900e1'
     and dog_b_id = '99999999-9999-9999-9999-9999999900f1';

  set local role authenticated;
  set local request.jwt.claim.sub = '99999999-9999-9999-9999-9999999900a0';

  select count(*) into visible_count from public.messages where match_id = m_id;
  if visible_count <> 0 then raise exception 'C should not see messages on a match they are not in (got %)', visible_count; end if;

  begin
    insert into public.messages (match_id, sender_id, body)
      values (m_id, '99999999-9999-9999-9999-9999999900a0', 'i should not be here');
  exception when others then
    insert_blocked := true;
  end;
  if not insert_blocked then raise exception 'C insert should be blocked by RLS'; end if;
end $$;
reset role;

rollback;
