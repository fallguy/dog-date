-- Run with: psql "$DB_URL" -f __tests__/sql/handle-new-user.test.sql
-- Asserts handle_new_user() inserts a profiles row using raw_user_meta_data->>'display_name'.
\set ON_ERROR_STOP on
\set VERBOSITY verbose

begin;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-9999-9999-99999999000a', 'authenticated', 'authenticated', 'handle-new-user@example.com', '', now(), '{}', '{"display_name":"Test Q"}', now(), now(), '', '', '', '');

do $$
begin
  if (select count(*) from public.profiles where id = '99999999-9999-9999-9999-99999999000a' and display_name = 'Test Q') <> 1 then
    raise exception 'Expected profiles row with display_name Test Q for new auth.users insert';
  end if;
end $$;

rollback;
