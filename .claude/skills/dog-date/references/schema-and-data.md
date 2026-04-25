# Schema, migrations, and seed data

Read this when you're adding a column, table, RLS policy, trigger, seed dog, or anything that touches Postgres.

## The local-first workflow

Dog Date runs against `supabase start` (Docker on localhost:54321-54324). The cloud project doesn't exist yet — that's a step-11 concern. Until then, every schema change is:

1. `supabase migration new <slug>` — generates a timestamped SQL file in `supabase/migrations/`
2. Edit the SQL.
3. `supabase db reset` — drops the local DB and re-applies all migrations + seed.
4. `supabase gen types typescript --local > lib/database.types.ts` — regenerate the TypeScript types (any query that selects a new column will be unsafe-cast otherwise).

If your change is small enough to apply without resetting (e.g. an additive column on an empty table), `psql -f <new-migration>.sql` works too — and preserves your active session JWT, which `db reset` invalidates. Use that trick for fast iteration; commit and run a full reset before merging.

## Migration order matters

Migrations apply in filename order. Names look like `YYYYMMDD_NNN_short_slug.sql`. Don't rename committed migrations — even if the timestamp seems off — because Supabase tracks them by filename. Add new ones; never edit applied ones.

Existing migrations:

| File | What it adds |
|---|---|
| `20260424161542_core.sql` | profiles, dogs, swipes, matches, video_jobs + match-creation trigger + new-user trigger + initial RLS |
| `20260424170124_storage.sql` | dog-photos and dog-videos buckets (public read, owner write) |
| `20260425_001_chat_safety.sql` | messages, reports, blocks, moderation_queue view, haversine_miles function |
| `20260425_002_push_blocks.sql` | push_tokens table + replace open dogs SELECT policy with one that hides blocked relationships |

## Tables at a glance

```
profiles      id (= auth.users.id), display_name, photo_url, bio, tags[],
              lat, lng, search_radius_miles, created_at, updated_at

dogs          id, owner_id (→ profiles, ON DELETE CASCADE), name, breed,
              birthdate, size (enum), energy (enum), tags[], notes,
              photos[], primary_photo_url,
              ai_video_url, ai_video_status (enum), ai_video_prompt, ai_video_scenario
              UNIQUE (owner_id)  -- one dog per owner in v1

video_jobs    id, dog_id, provider, fal_request_id, prompt, scenario,
              status (enum), cost_cents, error, started_at, completed_at

swipes        id, swiper_dog_id, target_dog_id, direction (enum),
              UNIQUE (swiper_dog_id, target_dog_id),
              CHECK (swiper_dog_id <> target_dog_id)

matches       id, dog_a_id, dog_b_id, created_at,
              UNIQUE (dog_a_id, dog_b_id),
              CHECK (dog_a_id < dog_b_id)  -- canonical ordering

messages      id, match_id, sender_id, body, created_at
              (RLS: only members of the match can read/insert)

reports       id, reporter_id, target_id, reason, notes, status,
              CHECK (reporter_id <> target_id)
              (RLS: users see only their own reports)

blocks        blocker_id, blocked_id, created_at
              PK (blocker_id, blocked_id),
              CHECK (blocker_id <> blocked_id)
              (RLS: users manage only their own blocks; blocks affect dogs SELECT visibility)

push_tokens   id, user_id, expo_token, device_label, created_at, updated_at
              UNIQUE (user_id, expo_token)
```

## Triggers — the load-bearing magic

Two triggers run automatically on writes. Know what they do before you change related tables.

### `handle_new_user` (on `auth.users` insert)

When a new auth.users row appears, this `security definer` function inserts a corresponding `profiles` row with the display_name pulled from `raw_user_meta_data` or the email's local part. **Required**: every screen assumes `profiles[id]` exists for the current `auth.uid()`. If you ever delete this trigger, the FK from dogs.owner_id → profiles will start failing on signup.

### `create_match_on_mutual_like` (on `swipes` insert)

When a `like` swipe is inserted, the trigger checks if the target dog has already swiped right on the swiper. If yes, it inserts a row into `matches` with `(dog_a_id < dog_b_id)` ordering. The MatchModal in the app fires because `useInsertSwipe` then queries the matches table and sees the new row.

If you change swipe semantics (e.g. "super like" direction), update this trigger.

### `demo_pre_like_new_dog` (lives in `seed.sql`, not a migration!)

Local-dev only. When a non-demo dog is inserted, four demo dogs (Maya/Jordan/Sam/Priya) automatically insert "like" swipes targeting it. This is what makes the demo flow work end-to-end without two real users — your first like on Biscuit triggers a match instantly.

**Never push this trigger to production.** It lives in `seed.sql` (which doesn't run on production migrations) by design. If you ever extract it to a migration, gate it behind an env check or a `DEV_ONLY` flag.

## Seed data (`supabase/seed.sql`)

`supabase/seed.sql` runs after migrations on `db reset`. Contents:

- 8 base demo dogs (Biscuit/Pickle/Juno/Moose/Scout/Ruby/Kobe/Waffles) with Unsplash photos
- 3 stress-test dogs:
  - **Sir Reginald Bartholomew III** (long name + long breed: Cavalier King Charles Spaniel)
  - **Snickerdoodle Maximillian** (long single-word name + Catahoula Leopard Dog)
  - **Juniper-Belle** (hyphenated name + Australian Shepherd)
- Biscuit gets a 4-photo album so the photo carousel on the dog detail screen has something to test
- The `demo_pre_like_new_dog` trigger function + trigger

If you add a demo dog:

1. Add an `auth.users` row with `id = '11111111-1111-1111-1111-1111111111<XX>'` (next free 2-digit slot).
2. Add a `profiles` UPDATE for the bio (the trigger creates the profile but only sets display_name).
3. Add the `dogs` INSERT.
4. If you want this dog's owner to auto-like new users (the "always matches" pool), add their owner_id to the IN list inside `demo_pre_like_new_dog`. Currently 1101–1104.

Don't change the existing demo UUIDs — tests, scripts, and reference data depend on them.

## RLS — what enforces what

| Table | Read policy | Write policy |
|---|---|---|
| profiles | public | only own row |
| dogs | NOT EXISTS a block in either direction | only own dog (one per owner) |
| video_jobs | only the dog's owner | service role (edge functions) |
| swipes | only your own | only your own |
| matches | only matches involving your dog | (trigger, security definer) |
| messages | only match members | sender_id must be auth.uid() AND match member |
| reports | only the reporter | only the reporter |
| blocks | only the blocker | only the blocker |
| push_tokens | only the user | only the user |
| moderation_queue (view) | (no policy — admins query via service role only) | n/a |

The block-aware dogs SELECT policy is critical: when user A blocks user B, B's dogs disappear from A's swipe deck *automatically* through RLS. No application-layer filter needed in `useNearbyDogs`. If you change the dogs SELECT policy, that invariant is your responsibility.

## TypeScript types

`lib/database.types.ts` is the generated file from `supabase gen types typescript --local`. Regenerate after every migration. The `DogRow` type (in `lib/demo-dogs.ts`) is hand-rolled because it includes a join with `owner` that the generated types describe at the relation level rather than as a flat row.

If a query returns a shape the generator doesn't model (joined columns), you'll see `as unknown as <Type>` casts — preferred over `any`. See `useNearbyDogs.ts` and `useDog.ts` for the pattern.

## Reset scripts

- **`supabase db reset`** — wipes everything, re-applies migrations, runs seed. Invalidates JWTs in any signed-in client (clear browser storage after).
- **`scripts/reset-user.mjs <email>`** — deletes one user (cascades through profiles/dogs/swipes/matches/messages/etc.). Preserves the seed.
- **`scripts/reset-user.mjs --all-non-demo`** — wipes all users *except* the seed (UUIDs starting `11111111-…`). Use this between demo runs.
- **After any reset that wipes auth.users**, the user must clear browser storage:
  ```js
  // in the preview console
  localStorage.clear(); location.href = '/'
  ```

## Common schema tasks — the recipe

### Add a column to dogs

1. `supabase migration new add_dogs_<column>`
2. Edit the new SQL file: `alter table public.dogs add column <name> <type> [default ...];`
3. `supabase db reset`
4. `supabase gen types typescript --local > lib/database.types.ts`
5. Update `DogRow` in `lib/demo-dogs.ts` if the column is part of the swipe-card payload, plus the `select(...)` strings in `useNearbyDogs` / `useDog`.
6. If the column should appear in the UI, follow up with the `references/ui-and-theme.md` recipe.

### Add a new table

1. `supabase migration new add_<table>`
2. SQL: `create table`, indexes, `alter table ... enable row level security`, policies.
3. `supabase db reset`, regenerate types.
4. Add a query hook in `lib/queries/`. Mirror the style of `useDog.ts` or `useMatches.ts` depending on read shape.
5. Write at least one SQL test in `__tests__/sql/<table>.test.sql` — usually verifying the RLS policy actually denies what it's supposed to deny. (RLS is the easiest layer to silently break.)

### Add an RLS policy

After writing the policy, **always** test that an unrelated user cannot read/write what the policy forbids. Pattern:

```sql
-- in __tests__/sql/<feature>.test.sql
set local role authenticated;
set local request.jwt.claim.sub = '<uuid-of-test-user-A>';
-- run the query that should succeed
-- run the query that should fail; assert empty result or exception
```

Without that test, RLS bugs are invisible until production.

### Change the demo-pre-like list

Edit `seed.sql`'s `demo_pre_like_new_dog` function body — the `IN (…)` list of owner UUIDs that auto-like new dogs. After editing, `supabase db reset` and verify by signing up a new user and checking the matches list.

## Don't do

- **Don't edit applied migration files.** Add a new one.
- **Don't use `git add -A`** when committing — Supabase generates `.branches/` and `.temp/` artifacts you shouldn't commit. The repo's `.gitignore` covers these but `-A` would still pull in stray test files.
- **Don't bypass RLS** with the service role just because it's convenient. If a screen needs admin access (the moderation queue), gate it via `EXPO_PUBLIC_ADMIN_EMAILS` in the client, but the query itself goes through the public schema with normal RLS. Service role is for edge functions, not the app.
- **Don't change the canonical match ordering** (`dog_a_id < dog_b_id`). Several queries assume it.
