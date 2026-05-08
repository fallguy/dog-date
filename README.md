# Dog Date (hi andrew)

Tinder-style app for arranging dog playdates. Dog-first profiles, light owner info, in-app chat for matches.

Primary platform: iPhone. Android follows. Stack: **Expo + React Native + TypeScript** on the client, **Supabase** (Postgres + Auth + Storage + Realtime) on the backend.

See [`/Users/bporter/.claude/plans/help-me-craft-a-radiant-haven.md`](../.claude-plan.md) for the full product and stack rationale.

## Prerequisites

- Node 20+
- Docker Desktop (running) — required for the local Supabase stack
- Homebrew (for the Supabase CLI on macOS)
- iOS Simulator (Xcode) or Expo Go on a physical device

## First-time setup

```bash
# 1. Install JS deps
npm install

# 2. Install Supabase CLI
brew install supabase/tap/supabase

# 3. Boot the local backend (first run pulls Docker images, ~5-10 min)
supabase start

# 4. Copy the API URL + anon key from the start output into .env
cp .env.example .env
# Edit .env: set EXPO_PUBLIC_SUPABASE_URL to http://<your-mac-lan-ip>:54321
#           and EXPO_PUBLIC_SUPABASE_ANON_KEY to the printed anon key

# 5. Generate typed schema (run after every migration)
supabase gen types typescript --local > lib/database.types.ts
```

`supabase start` brings up:
- Postgres (54322), API gateway (54321), Auth (54321/auth/v1), Storage, Realtime
- **Studio admin UI**: http://localhost:54323 — view tables, run SQL, manage auth
- **Inbucket** (local email inbox): http://localhost:54324 — magic-link sign-in emails appear here
- See `supabase/README.md` for migrations and cloud-deploy instructions.

## Run

```bash
npm run ios        # iOS Simulator
npm run android    # Android emulator (later)
npm run web        # Web preview (debugging only)
```

Or `npx expo start` and pick a target.

## Project structure

```
app/              # Expo Router screens (file-based routing)
  (tabs)/         # Tab navigation
  _layout.tsx     # Root layout — Query provider, theme
components/       # Reusable UI components
hooks/            # Custom hooks (color scheme, theme)
lib/
  supabase.ts     # Supabase client
  query-client.ts # TanStack Query client
  queries/        # Typed query hooks per entity (TODO)
supabase/
  migrations/     # SQL migrations
  functions/      # Edge functions
  README.md       # Supabase-specific setup
assets/           # Images, fonts
```

## Environment variables

All env vars exposed to the app must be prefixed `EXPO_PUBLIC_`. See `.env.example`.

## Scripts

- `npm run ios` / `android` / `web` — launch the app on a target
- `npm start` — start the Metro bundler
- `npm run lint` — ESLint
- `npm run check:web` — fetch the running web bundle and parse it in script-mode (catches `import.meta` regressions). Requires Metro on :8081.
- `npm test` / `test:component` / `test:lib` — Vitest (jsdom). See `__tests__/README.md` for all five test layers.
- `npm run test:sql` / `test:edge` / `test:e2e` — SQL trigger tests (psql), edge function smokes (Deno), Playwright E2E.
- `npm run reset-project` — move the starter boilerplate to `app-example/` and scratch `app/` (run only once you're ready to delete the template content)

## Reset state during testing

Two scenarios. Both keep the 11 seed dogs (Biscuit/Pickle/Juno/...) and their AI videos intact.

### Fresh "first-time open" — wipe one user

```bash
node scripts/reset-user.mjs you@example.com
```

Cascades through `profiles → dogs → swipes → matches → messages → video_jobs → blocks → reports → push_tokens` for that one user. Demo seed users (`11111111-…`) are protected — the script refuses to delete them.

### Fresh "first-time open" — wipe every non-demo user

```bash
node scripts/reset-user.mjs --all-non-demo
```

Same cascade, but for every user whose UUID does not start with `11111111`. Use this between demo runs.

### Then clear browser storage

`db reset` and the user-reset script both wipe `auth.users`. The browser still holds the stale JWT — without clearing, the next request 500s on a foreign-key violation. In the running web preview's DevTools console:

```js
localStorage.clear(); sessionStorage.clear();
const dbs = (await indexedDB.databases?.()) ?? [];
for (const d of dbs) if (d.name) indexedDB.deleteDatabase(d.name);
location.href = '/'
```

### Full nuke (rebuild schema + seed + videos)

```bash
supabase db reset                     # drop + re-apply migrations + run seed.sql
node scripts/seed-demo-videos.mjs     # ~$3.30 to Fal; idempotent (skips ready dogs)
```

`db reset` is rare — only when you've changed migrations or want a guaranteed pristine schema.

After any reset that wipes `auth.users`, repeat the **Clear browser storage** step.

### Demo trigger reminder

When a non-demo dog is inserted, `demo_pre_like_new_dog` (in `seed.sql`) auto-inserts 4 "like" swipes from Maya/Jordan/Sam/Priya targeting the new dog. This is what makes the swipe → match → chat flow work end-to-end without a second human. After signing in fresh, the deck shows "Matches · 4" before you swipe right on anyone.

## MVP roadmap

See the approved plan for build order. Next up: auth with Sign in with Apple → profile + dog creation → swipe deck.
