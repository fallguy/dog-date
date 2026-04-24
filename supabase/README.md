# Supabase

Database schema and edge functions live here. The app connects via `lib/supabase.ts` using credentials from `.env`.

**Default development workflow is local-first** — we don't touch a cloud project until we're ready to ship to TestFlight.

## Local dev (default)

Prerequisites: Docker Desktop running, `brew install supabase/tap/supabase`.

```bash
# First time only:
cd /Users/bporter/Documents/funProjects/dog-date
supabase init           # already done — leaves config.toml

# Every time you start working:
supabase start          # boots Postgres + Auth + Storage + Realtime + Studio
                        # first run downloads images (~5–10 min); subsequent runs ~5s
                        # prints local API URL + anon key + service role key

# When you change schema:
supabase migration new <slug>      # creates a new SQL file in migrations/
# edit the file, then:
supabase db reset                  # nukes local DB and re-applies all migrations
                                   # safe! it's all local

# Type generation (run after schema changes):
supabase gen types typescript --local > ../lib/database.types.ts

# Stop the stack (frees memory):
supabase stop
```

After `supabase start` you'll see URLs printed:

- **API**: `http://127.0.0.1:54321` — the URL the app talks to
- **Studio**: `http://127.0.0.1:54323` — admin UI in the browser
- **Inbucket** (local email inbox): `http://127.0.0.1:54324` — magic-link sign-in emails appear here

Copy the `anon key` from the start output into `.env` at the repo root:

```
EXPO_PUBLIC_SUPABASE_URL=http://<your-mac-lan-ip>:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start output>
```

Use your Mac's LAN IP (not `localhost`) so a physical iPhone on the same Wi-Fi can reach it.

## Cloud deploy (later — for TestFlight)

```bash
# One-time:
supabase login
supabase projects create dog-date    # or via the dashboard
supabase link --project-ref YOUR-REF

# Push local migrations to the cloud project:
supabase db push

# Type-gen against the linked cloud project:
supabase gen types typescript --linked > ../lib/database.types.ts

# Update .env with the cloud URL + anon key from the dashboard
```

## Directory layout

- `config.toml` — local CLI config (auto-created by `supabase init`).
- `migrations/` — SQL migrations, committed to git, applied in order. The first one is `..._core.sql`.
- `functions/` — edge functions (Deno). Run locally with `supabase functions serve`. Deployed with `supabase functions deploy <name>`.
- `seed.sql` — *(not yet)* — will hold demo data once we have an onboarding flow that creates real auth users.
