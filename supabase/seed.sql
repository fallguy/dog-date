-- Local-dev seed: 8 demo dogs so the swipe deck has cards on first run.
-- Mirrors lib/demo-dogs.ts. Inserts auth.users → trigger creates profiles → we add bios → insert dogs.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111101', 'authenticated', 'authenticated', 'maya@demo.local',  '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Maya"}',  now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111102', 'authenticated', 'authenticated', 'jordan@demo.local','', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Jordan"}',now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111103', 'authenticated', 'authenticated', 'sam@demo.local',   '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Sam"}',   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111104', 'authenticated', 'authenticated', 'priya@demo.local', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Priya"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111105', 'authenticated', 'authenticated', 'alex@demo.local',  '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Alex"}',  now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111106', 'authenticated', 'authenticated', 'dani@demo.local',  '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Dani"}',  now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111107', 'authenticated', 'authenticated', 'kenji@demo.local', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Kenji"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111108', 'authenticated', 'authenticated', 'riley@demo.local', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Riley"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111109', 'authenticated', 'authenticated', 'theodore@demo.local', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Theodore"}',  now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111110', 'authenticated', 'authenticated', 'vee@demo.local',       '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Vee"}',       now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'marcellus@demo.local', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Marcellus"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

update public.profiles set bio = 'Morning walker, early-30s, south end.'   where id = '11111111-1111-1111-1111-111111111101';
update public.profiles set bio = 'Dad of two humans + one frog-shaped dog.' where id = '11111111-1111-1111-1111-111111111102';
update public.profiles set bio = 'Trail runner, hates small talk, loves dog talk.' where id = '11111111-1111-1111-1111-111111111103';
update public.profiles set bio = 'Weekend hiker with a retired pup.'        where id = '11111111-1111-1111-1111-111111111104';
update public.profiles set bio = 'First-time dog owner, taking it slow.'    where id = '11111111-1111-1111-1111-111111111105';
update public.profiles set bio = 'Writer, plant person, loud laugher.'      where id = '11111111-1111-1111-1111-111111111106';
update public.profiles set bio = 'Designer, morning person, quiet walker.'  where id = '11111111-1111-1111-1111-111111111107';
update public.profiles set bio = 'Cyclist with a dog-shaped sidecar.'       where id = '11111111-1111-1111-1111-111111111108';
update public.profiles set bio = 'Park-bench philosopher with a regal companion.'        where id = '11111111-1111-1111-1111-111111111109';
update public.profiles set bio = 'Mountain trail guide. Always with two coffees.'        where id = '11111111-1111-1111-1111-111111111110';
update public.profiles set bio = 'Audio engineer, weekend baker, very early riser.'      where id = '11111111-1111-1111-1111-111111111111';

insert into public.dogs (owner_id, name, breed, size, energy, tags, notes, primary_photo_url, birthdate) values
  ('11111111-1111-1111-1111-111111111101', 'Biscuit', 'Golden Retriever',     'Large',  'High',   ARRAY['fetch-obsessed','loves water','gentle'],            'Will trade any object in the world for a tennis ball. Afraid of vacuum cleaners.', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80', (now() - interval '3 years')::date),
  ('11111111-1111-1111-1111-111111111102', 'Pickle',  'French Bulldog',       'Small',  'Medium', ARRAY['snores','toddler-tested','loves treats'],           'Half dog, half potato. Will sit on your feet until you move.',                     'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80', (now() - interval '2 years')::date),
  ('11111111-1111-1111-1111-111111111103', 'Juno',    'Australian Shepherd',  'Medium', 'High',   ARRAY['off-leash trained','agility','smart'],              'Knows 14 tricks, invented 3 more. Will herd your children if asked nicely.',       'https://images.unsplash.com/photo-1568572933382-74d440642117?w=800&q=80', (now() - interval '4 years')::date),
  ('11111111-1111-1111-1111-111111111104', 'Moose',   'Bernese Mountain Dog', 'Large',  'Chill',  ARRAY['gentle giant','kid-friendly','slow walks'],         'Built like a couch, moves like a glacier. Ideal brunch companion.',                'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&q=80', (now() - interval '5 years')::date),
  ('11111111-1111-1111-1111-111111111105', 'Scout',   'Border Collie Mix',    'Medium', 'High',   ARRAY['puppy energy','still learning','park-obsessed'],    'Newly adopted from the shelter. Zoomies at 7am sharp, every day.',                 'https://images.unsplash.com/photo-1567752881298-894bb81f9379?w=800&q=80', (now() - interval '1 years')::date),
  ('11111111-1111-1111-1111-111111111106', 'Ruby',    'Dachshund',            'Small',  'Medium', ARRAY['bossy','anti-squirrel','sweaters required'],        'Tiny body, enormous opinions. Will tell you how she feels.',                       'https://images.unsplash.com/photo-1612774412771-005ed8e861d2?w=800&q=80', (now() - interval '6 years')::date),
  ('11111111-1111-1111-1111-111111111107', 'Kobe',    'Shiba Inu',            'Medium', 'Medium', ARRAY['cat-like','screams sometimes','photogenic'],        'Acts like he owns the park. Possibly does. Will pose for photos.',                 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80', (now() - interval '3 years')::date),
  ('11111111-1111-1111-1111-111111111108', 'Waffles', 'Corgi',                'Small',  'High',   ARRAY['short king','sprint specialist','food motivated'],  'Legs short, ambitions enormous. Runs faster than you expect.',                     'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=800&q=80', (now() - interval '2 years')::date),
  ('11111111-1111-1111-1111-111111111109', 'Sir Reginald Bartholomew III', 'Cavalier King Charles Spaniel', 'Small',  'Chill', ARRAY['couch potato','royalty','no swimming'],            'A small dog with the bearing of a duke. Will not eat off the floor.',                'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=800&q=80', (now() - interval '7 years')::date),
  ('11111111-1111-1111-1111-111111111110', 'Snickerdoodle Maximillian',    'Catahoula Leopard Dog',         'Large',  'High',  ARRAY['needs a job','vocalizes opinions','herder'],       'Wants to herd you, the cat, and the sofa. Has goals. Has feelings about your goals.', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80', (now() - interval '4 years')::date),
  ('11111111-1111-1111-1111-111111111111', 'Juniper-Belle',                'Australian Shepherd',           'Medium', 'High',  ARRAY['frisbee','agility','tireless'],                    'Will fetch a thrown stick once. After that you owe her three more throws or she sulks.', 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=800&q=80', (now() - interval '3 years')::date)
on conflict (owner_id) do nothing;

-- Biscuit gets a photo album for the multi-photo viewer.
update public.dogs
set photos = ARRAY[
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
  'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&q=80',
  'https://images.unsplash.com/photo-1633722715534-7e2d44a93f15?w=800&q=80'
]
where owner_id = '11111111-1111-1111-1111-111111111101';

-- Local-dev only: 4 of the 8 demo dogs auto-like every new (non-demo) dog so the
-- match flow can be tested end-to-end without a second human user. Half the demo
-- swipes still produce no match, which is closer to real-world behavior.
create or replace function public.demo_pre_like_new_dog()
returns trigger language plpgsql security definer as $$
begin
  if new.owner_id::text like '11111111-1111-1111-1111-1111111111%' then
    return new;
  end if;
  insert into public.swipes (swiper_dog_id, target_dog_id, direction)
  select d.id, new.id, 'like' from public.dogs d
  where d.owner_id in (
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104'
  )
  on conflict (swiper_dog_id, target_dog_id) do nothing;
  return new;
end;
$$;

drop trigger if exists demo_pre_like_new_dog on public.dogs;
create trigger demo_pre_like_new_dog
  after insert on public.dogs
  for each row execute function public.demo_pre_like_new_dog();
