-- Run with: psql "$DB_URL" -f __tests__/sql/match-trigger.test.sql
\set ON_ERROR_STOP on
\set VERBOSITY verbose

begin;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999991', 'authenticated', 'authenticated', 'test-a@example.com', '', now(), '{}', '{"display_name":"Test A"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-999999999992', 'authenticated', 'authenticated', 'test-b@example.com', '', now(), '{}', '{"display_name":"Test B"}', now(), now(), '', '', '', '');

insert into public.dogs (id, owner_id, name, breed, size, energy, primary_photo_url) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999991', 'TestA', 'Mix', 'Medium', 'Medium', 'https://example.com/a.jpg'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999992', 'TestB', 'Mix', 'Medium', 'Medium', 'https://example.com/b.jpg');

delete from public.swipes where target_dog_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
delete from public.matches where dog_a_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') or dog_b_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Test 1: A likes B (no match yet)
insert into public.swipes (swiper_dog_id, target_dog_id, direction) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'like');
do $$
begin
  if (select count(*) from public.matches where (dog_a_id, dog_b_id) = ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')) <> 0 then
    raise exception 'Match should not exist after one-sided like';
  end if;
end $$;

-- Test 2: B likes A → match created with canonical ordering
insert into public.swipes (swiper_dog_id, target_dog_id, direction) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'like');
do $$
begin
  if (select count(*) from public.matches where dog_a_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and dog_b_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') <> 1 then
    raise exception 'Match should exist after mutual like';
  end if;
end $$;

-- Test 3: pass swipe should not create a match
delete from public.matches where dog_a_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and dog_b_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
delete from public.swipes where swiper_dog_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and target_dog_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
insert into public.swipes (swiper_dog_id, target_dog_id, direction) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pass');
do $$
begin
  if (select count(*) from public.matches where dog_a_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') <> 0 then
    raise exception 'Match should not exist after pass swipe';
  end if;
end $$;

rollback;
