# Dog Date

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
- `npm run reset-project` — move the starter boilerplate to `app-example/` and scratch `app/` (run only once you're ready to delete the template content)

## MVP roadmap

See the approved plan for build order. Next up: auth with Sign in with Apple → profile + dog creation → swipe deck.
