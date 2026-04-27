-- Run with: psql "$DB_URL" -f __tests__/sql/demo-pre-like-trigger.test.sql
-- Asserts demo_pre_like_new_dog (defined in seed.sql) auto-likes a new dog from
-- exactly the four demo owners that own Biscuit, Pickle, Juno, and Moose.
\set ON_ERROR_STOP on
\set VERBOSITY verbose

begin;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-99999999000b', 'authenticated', 'authenticated', 'pre-like-test@example.com', '', now(), '{}', '{"display_name":"PreLikeTester"}', now(), now(), '', '', '', '');

insert into public.dogs (id, owner_id, name, breed, size, energy, primary_photo_url) values
  ('99999999-9999-9999-9999-9999999900b1', '99999999-9999-9999-9999-99999999000b', 'PreLikeDog', 'Mix', 'Medium', 'Medium', 'https://example.com/p.jpg');

do $$
declare
  swipe_count integer;
  expected_owners uuid[] := array[
    '11111111-1111-1111-1111-111111111101'::uuid,
    '11111111-1111-1111-1111-111111111102'::uuid,
    '11111111-1111-1111-1111-111111111103'::uuid,
    '11111111-1111-1111-1111-111111111104'::uuid
  ];
begin
  select count(*) into swipe_count
  from public.swipes s
  join public.dogs d on d.id = s.swiper_dog_id
  where s.target_dog_id = '99999999-9999-9999-9999-9999999900b1'
    and s.direction = 'like'
    and d.owner_id = any(expected_owners);

  if swipe_count <> 4 then
    raise exception 'Expected 4 like swipes from Biscuit/Pickle/Juno/Moose owners, got %', swipe_count;
  end if;

  if (select count(*) from public.swipes where target_dog_id = '99999999-9999-9999-9999-9999999900b1') <> 4 then
    raise exception 'Expected exactly 4 total swipes targeting the new dog';
  end if;
end $$;

rollback;
