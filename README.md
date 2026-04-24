# Dog Date

Tinder-style app for arranging dog playdates. Dog-first profiles, light owner info, in-app chat for matches.

Primary platform: iPhone. Android follows. Stack: **Expo + React Native + TypeScript** on the client, **Supabase** (Postgres + Auth + Storage + Realtime) on the backend.

See [`/Users/bporter/.claude/plans/help-me-craft-a-radiant-haven.md`](../.claude-plan.md) for the full product and stack rationale.

## Prerequisites

- Node 20+
- iOS Simulator (Xcode) or Expo Go on a physical device
- A Supabase project (free tier is fine)

## First-time setup

```bash
npm install
cp .env.example .env
# Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
```

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
