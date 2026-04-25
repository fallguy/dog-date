---
name: dog-date
description: Orient a new agent on the Dog Date codebase before they touch anything. Use this skill whenever you're about to work on Dog Date — adding a feature, fixing a bug, writing tests, modifying the schema, restyling the UI, debugging the swipe deck, anything. Even "trivial" tasks like renaming a button or tweaking a color benefit from reading this first because Dog Date has several non-obvious gotchas (web-bundle landmines, auth/JWT staleness after db reset, gesture-handler pointer-events traps) that will burn an agent that just dives in. Read this skill once at session start; reach for the reference files in `.claude/skills/dog-date/references/` when you need depth on TDD, schema/migrations, UI theming, auth/demo flow, or the AI video pipeline.
---

# Dog Date

A Tinder-style mobile app for arranging dog playdates. Dog-first profiles, light owner info. The signature feature: the user uploads their dog's photo, an AI-generated 5-second video of the dog in a fun scenario (pilot, chef, surfer) plays on the swipe card.

This skill orients you on the project so you don't waste time learning what's already known and don't trip over the well-documented gotchas. **Read it once before doing real work.**

## What you're working on

- Repo: `/Users/bporter/Documents/funProjects/dog-date`
- Stack: Expo SDK 54 + React Native + TypeScript + Expo Router
- Backend: local Supabase via the CLI (Postgres 17, Auth, Storage, Realtime, Studio)
- AI video: Fal.ai → `fal-ai/veo3.1/lite/image-to-video` (~$0.30/clip, 5s, 9:16)
- State: TanStack Query (server) + Zustand (client). **No `zustand/middleware`** — see the web-bundle gotcha below.

The complete engineering handoff lives at `/Users/bporter/.claude/plans/help-me-craft-a-radiant-haven.md`. Read that if this skill leaves you with open questions about the *why* behind a design choice.

## Where things live

```
app/                         Expo Router screens
  index.tsx                  sign-in (email + 6-digit OTP)
  onboarding.tsx             create/edit dog
  generate-video.tsx         prompt entry → Fal submit
  swipe.tsx                  swipe deck + status banner + match modal
  matches.tsx                list of matches
  chat/[matchId].tsx         realtime chat
  dog/[dogId].tsx            other-user dog profile
  profile.tsx                your own profile
  admin/moderation.tsx       admin queue (gated by EXPO_PUBLIC_ADMIN_EMAILS)
  _layout.tsx                root: fonts, GestureHandlerRoot, QueryClient, auth init,
                             VideoPoller, PushRegistration

components/                  presentational
  DogCard.tsx                centerpiece — photo or AI video, name, meta, bio
  SwipeDeck.tsx              pan-gesture deck (forwardRef + imperative .swipe(dir))
  MatchModal.tsx             match takeover with Say-hi-to-{owner} CTA
  VideoStatusBanner.tsx      generating/ready/failed state machine
  VideoPreviewModal.tsx      fullscreen video preview

lib/
  theme.ts                   SINGLE source of truth for colors/fonts/tracking/radii
  supabase.ts                typed client (SSR-safe storage)
  auth-store.ts              Zustand session wrapper
  notifications-store.ts     hand-rolled AsyncStorage persist (DON'T use zustand/middleware)
  query-client.ts            TanStack QueryClient
  storage.ts                 photo upload helper
  demo-dogs.ts               Dog type + DogRow type + mapDogRowToCard
  video-scenarios.ts         curated AI prompts
  database.types.ts          GENERATED via `supabase gen types typescript --local`
  location.ts                expo-location wrapper + haversineMiles
  hooks/
    useVideoPoller.ts        global polling for own pending video
    usePushRegistration.ts   register Expo push token
  queries/                   TanStack hooks: useMyDog, useDog, useNearbyDogs,
                             useMatches, useMessages, useInsertSwipe,
                             useInsertMessage, useSendReport, useBlock,
                             useUpsertPushToken, useNotify, useModerationQueue

supabase/
  config.toml                local CLI config (ports 54321-54324)
  migrations/                applied in name order
    20260424161542_core.sql              profiles, dogs, video_jobs, swipes, matches
    20260424170124_storage.sql           dog-photos / dog-videos buckets
    20260425_001_chat_safety.sql         messages, reports, blocks, moderation_queue
    20260425_002_push_blocks.sql         push_tokens, block-aware dogs RLS
  seed.sql                   8 demo dogs + 3 stress-test dogs + demo_pre_like trigger
  functions/
    generate-dog-video/      Deno edge fn: validate → base64 photo → Fal queue
    fal-poll/                Deno edge fn: poll Fal status → update dog row
    notify/                  Deno edge fn: fan-out Expo push notifications

scripts/
  check-web-bundle.js        run after npm start to catch ESM-only code
  reset-project.js           wipe everything (Expo template default)
  reset-user.mjs             delete one user OR --all-non-demo (preserves seed)
  seed-demo-videos.mjs       generate AI videos for first 3 demo dogs (~$0.90)
```

## How to run it

```bash
# one-time
brew install supabase/tap/supabase
supabase start                                                    # ~5-10 min first time

# every session
supabase db reset                                                 # apply migrations + seed
supabase functions serve --no-verify-jwt --env-file supabase/functions/.env  # in another terminal
npm start                                                         # in another terminal
```

Useful URLs while running:
- App: http://localhost:8081 (press `w` in Metro to open web)
- Studio (DB UI): http://localhost:54323
- Mailpit (OTP inbox): http://localhost:54324

## Gotchas — do not skip this section

These have already burned the project. Internalize them.

### 1. Web bundle parses as a classic script (`<script>` not `type="module"`)

Any ESM-only construct — most commonly `import.meta.env` from Vite-style packages — throws `SyntaxError: Cannot use 'import.meta' outside a module` at parse time. The error fires before React mounts, before DevTools attaches. Symptom: stuck loading spinner, **zero console output.**

- **Never import from `zustand/middleware`.** The barrel re-exports `devtools`, which contains `import.meta.env.MODE`. Subpath `zustand/middleware/persist` is also broken in v5 (`exports` field points at a non-existent `.mjs`). For persistence, hand-roll AsyncStorage (see `lib/notifications-store.ts`).
- **Run `npm run check:web` before merging any PR that adds an npm dep.** It fetches the running web bundle and parses it in Node's script-mode parser. ~1 second once the bundle is built.

### 2. `supabase db reset` invalidates client JWTs

`db reset` wipes `auth.users`. Browser/AsyncStorage still holds the old JWT. The next request fails — but the session object often *says* it's signed in, so screens like onboarding render and try to insert a `dogs` row with an `owner_id` that no longer exists in `profiles`. The user sees: "violates foreign key constraint dogs_owner_id_fkey".

**Fix:** clear browser storage when this happens. `localStorage.clear()` in DevTools, then reload. The reset-user script also reminds you of this.

### 3. The `<video>` and `<img>` elements swallow drag events on web

Native HTML media elements default to `pointer-events: auto` and intercept pointerdown before it reaches the SwipeDeck's `GestureDetector`. Programmatic event dispatch on the parent div appears to "work" but real mouse drags don't.

- **DogCard wraps Image and VideoView in `<View pointerEvents="none">`** so drags reach the gesture handler.
- **SwipeDeck exposes an imperative `.swipe(direction)` method** via `forwardRef` for click-driven Pass/Like buttons (mouse drag on web is not always reliable; buttons are the demo path).

### 4. Fal Queue API has a URL split

- Submit → `https://queue.fal.run/fal-ai/veo3.1/lite/image-to-video`
- Status/result → `https://queue.fal.run/fal-ai/veo3.1/requests/<id>/...` (note: NO `/lite/image-to-video`)

Both are hardcoded as `FAL_MODEL` in `generate-dog-video` and `FAL_APP` in `fal-poll`. **If you change models, update both.** Submitting a job with the wrong status URL silently sits in pending forever; we already paid that bill once.

### 5. Local Supabase Storage is unreachable from Fal's servers

Photos live at `http://<LAN-IP>:54321/storage/...`. Fal's servers can't see your LAN. The `generate-dog-video` edge fn downloads the photo, base64-encodes it, and submits as a `data:` URI. When you go to cloud, you can switch to passing the public Storage URL directly and skip the data-URI step.

### 6. The web-only `pointer-events:none` workaround applies to ALL media

If you add a new image or video element on top of a gesture-receiving area, wrap it in `<View pointerEvents="none">`. `expo-image` and `expo-video`'s underlying DOM elements both default to `pointer-events: auto` and will swallow events.

## Demo flow — what new users see

Every new user goes through this. Verify your changes don't break it.

1. `/` sign-in → email → OTP from Mailpit (http://localhost:54324)
2. `/onboarding` → photo, name, breed, size, energy, notes → Continue
3. **Demo trigger fires:** `demo_pre_like_new_dog` (in `seed.sql`) auto-inserts "like" swipes from Biscuit/Pickle/Juno/Moose targeting the new dog. So the new user has 4 instant matches waiting.
4. `/generate-video` → "Surprise me" → fire-and-forget submit → routes to `/swipe`.
5. `/swipe` → 11 nearby (including AI-videoed dogs Biscuit/Pickle/Juno) → swipe right (or click "Like") → MatchModal fires → "Say hi to Maya" → `/chat/<id>` → send a message.
6. `VideoStatusBanner` flips from "generating ✶" to "ready" → tap → `VideoPreviewModal`.

**Reset between demos:** `node scripts/reset-user.mjs <email>` then `localStorage.clear(); location.href = '/'` in the preview console.

## Conventions — match these or break the design

- **No emojis in UI** (intentional; the design said so explicitly). Allowed glyphs: `←` `→` `✶` `↑` `↳` `⋯` `×`.
- **No italic, no serif, no curly quotes** — we pivoted away from the editorial-magazine direction. The current aesthetic is photo-first, single sodium-yellow accent (`colors.accent` `#F7E14C`), Plus Jakarta Sans + JetBrains Mono.
- **Mono is for data only** (timestamps, distances, ages, IDs). Plus Jakarta Sans for everything else.
- **Yellow accent appears at most twice per visible viewport.** It's reserved for primary CTAs and AI affordances, not decoration.
- **All colors come from `lib/theme.ts`.** No hardcoded hex literals. If a value isn't in `theme.ts` and you need it, add a token.
- **No "VOL XII / ISSUE №" filler text.** Decorative chrome was rejected.
- **One short comment max where the why isn't obvious.** Don't write paragraph-length docstrings, don't reference "the new design" or "the old design" in comments — they rot.

## Workflow defaults

- **TDD by default.** The codebase has zero tests today; that's not a license to skip them on new work — it's a debt to start paying down. See `references/tdd.md` for the harness recipe (it covers SQL trigger tests via psql, edge function tests via Deno, and component tests via React Native Testing Library + jsdom).
- **Smallest possible change.** "Less code to accomplish the same goal" is the explicit project preference. Three similar lines beat a premature abstraction.
- **No backwards-compat shims.** This is a pre-launch app. Change the code, don't add a migration adapter.
- **Preview-verify visible changes.** If your change is observable in the running app, run `mcp__Claude_Preview__preview_screenshot` and confirm before reporting done. Type-check passing is necessary but not sufficient.

## When to read which reference

| Task | Read |
|------|------|
| Adding tests, refactoring tests, fixing a flaky test | `references/tdd.md` |
| Adding a column, a table, an RLS policy, or a seed dog | `references/schema-and-data.md` |
| Restyling a screen, adding a component, debugging the deck | `references/ui-and-theme.md` |
| Anything touching sign-in, the demo trigger, the reset script, or the smoketest user | `references/auth-and-demo-flow.md` |
| Touching `generate-dog-video`, `fal-poll`, video status banner, the seed-demo-videos script | `references/ai-video-pipeline.md` |

If you're not sure, the primer above + `references/tdd.md` is usually enough to start.

## Behavioral baseline

This skill follows the implementer/architect agent style from `bporter-project-seed/_dev/agents/`:

- **Don't sycophantically agree.** If a design choice in this skill seems wrong for the task at hand, push back with a specific reason.
- **Stop and ask** when requirements are ambiguous or you'd be guessing.
- **Honesty over speed.** If you don't know how something works, say "I don't understand X" and read the relevant reference or source file.
- **Find root causes.** Don't paper over symptoms. The `<video>` pointer-events bug existed for hours because the surface symptom (cropped photos) hid the real issue (events swallowed by the media element).
- **Speak in proper nouns.** Reference the file by path, the function by name, the migration by filename. Vague "I updated the swipe stuff" is a red flag.
