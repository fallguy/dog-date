# Auth and demo flow

Read this when you're touching sign-in, the OTP flow, the demo-pre-like trigger, the reset-user script, or anything that affects the smoketest user.

## How auth works

Local supabase Auth uses email magic-link with a 6-digit OTP. There is no password. Apple Sign-in is deferred until the project gets a real Apple Developer account.

Flow:

1. User types email, taps "Send sign-in code". `supabase.auth.signInWithOtp({ email })` fires.
2. Local supabase routes the email to **Mailpit** at `http://localhost:54324`. The body contains a 6-digit code.
3. User enters the code. `supabase.auth.verifyOtp({ email, token: code, type: 'email' })` returns a session.
4. The session is persisted via the supabase client's storage (AsyncStorage on native, localStorage on web).
5. The `handle_new_user` trigger (in core migration) fires on the new `auth.users` row, auto-creating a `profiles` row.
6. App redirects to `/onboarding` (no dog yet) or `/swipe` (dog exists).

The auth-store at `lib/auth-store.ts` is a thin Zustand wrapper around `supabase.auth.getSession()` + `onAuthStateChange`. `_layout.tsx` calls `initialize()` once on mount and gates the entire stack behind `isInitialized && fontsLoaded`.

## The single biggest auth gotcha

**`supabase db reset` invalidates all client JWTs.** It wipes `auth.users` along with everything else. The browser still has a JWT in localStorage; it points at a `sub` UUID that no longer exists in the DB.

What goes wrong if you don't clear browser storage after a reset:

- The auth-store loads the stale session, marks `isInitialized = true`.
- `_layout.tsx` renders the authenticated branch.
- Screens like `app/onboarding.tsx` read `session.user.id` (still the stale UUID) and try to `INSERT INTO dogs (owner_id, ...) VALUES (<stale-uuid>, ...)`.
- The FK `dogs.owner_id → profiles(id)` fails: `violates foreign key constraint "dogs_owner_id_fkey"`. The user sees "Couldn't save".

This happens silently — no errors before the FK violation. **Always clear browser storage after `db reset`.** From the preview console:

```js
localStorage.clear(); sessionStorage.clear();
const dbs = (await indexedDB.databases?.()) ?? [];
for (const d of dbs) if (d.name) indexedDB.deleteDatabase(d.name);
location.href = '/';
```

The reset-user script reminds you to do this; the db-reset command does not.

## Smoketest user

For one-off testing, the project has a habitual fake email: `smoketest@example.com`. There's nothing special about this address — Mailpit accepts anything @anything because it's a local SMTP catcher. But conventions matter:

- Use `smoketest@example.com` for Brian's manual demo runs.
- Use `demo+<timestamp>@example.local` for ephemeral / scripted runs (e.g. e2e tests).
- Use the demo seed UUIDs (`11111111-1111-1111-1111-111111111101` … `1111111108`, plus `09/10/11`) only for the seeded demo accounts.

If you find a hardcoded UUID in code that isn't from the demo set, that's a leftover and should be removed (`scripts/seed-demo-videos.mjs` references the demo set; that's correct).

## The demo trigger — `demo_pre_like_new_dog`

Lives in `supabase/seed.sql`. When a non-demo dog is inserted, the trigger automatically inserts "like" swipes from four demo dogs (Maya/Jordan/Sam/Priya, owners 1101–1104) targeting the new dog. So:

- Sign up as a fresh user → onboard → instantly have 4 dogs that already like you.
- First right-swipe on Biscuit/Pickle/Juno/Moose → mutual-like trigger fires → match created → MatchModal appears.

This is the only reason the "swipe → match → chat" demo path works without a second human. It's local-dev only and lives in `seed.sql`, not a migration, so it cannot ship to production. Keep it that way.

If you add a new demo owner that should also auto-like new users, update the trigger's `IN (…)` list.

## reset-user.mjs — the demo-reset utility

`scripts/reset-user.mjs` is the canonical way to reset between demos without losing seed data.

```bash
# remove a specific user (cascades through profiles, dogs, swipes, matches, messages,
# video_jobs, blocks, reports, push_tokens — preserves the seed)
node scripts/reset-user.mjs smoketest@example.com

# remove every non-demo user (keeps the 11 seed users)
node scripts/reset-user.mjs --all-non-demo
```

It refuses to delete demo seed users (UUIDs starting `11111111-…`). After running it, you still need to clear browser storage — the script reminds you with a one-line tip.

## The "stale JWT" symptom matrix

If a user reports auth-related weirdness, this matrix narrows it down fast:

| Symptom | Likely cause | Fix |
|---|---|---|
| Stuck loading screen, no console errors, no network activity | Web bundle parse error (likely a new ESM-only import) | `npm run check:web` |
| Stuck loading screen, network activity, `auth.getSession()` hangs | Stale JWT after `db reset` | Clear browser storage |
| "violates foreign key constraint dogs_owner_id_fkey" on onboarding | Stale JWT after `db reset` | Clear browser storage |
| Sign-in email never arrives | Mailpit not running, or email goes to console.log instead | Check supabase config; visit http://localhost:54324 |
| OTP code rejected immediately | Code expired (15 min) or already used | Send a new code |
| User signed in but `/swipe` redirects to `/` | Session present but no `myDog` row AND user.id not in profiles | Stale JWT — clear storage |

## Demo flow — what to verify after any auth-touching change

1. `node scripts/reset-user.mjs --all-non-demo`
2. Clear browser storage in the preview console.
3. Reload `/`. Sign-in screen should render with "DOG DATE" wordmark, "Find your dog's people." headline, EMAIL input.
4. Type any email → "Send sign-in code".
5. Open http://localhost:54324, find the email, copy the 6-digit code.
6. Enter code → "Sign in".
7. Land on `/onboarding`. Pick a photo, fill fields, Continue.
8. Land on `/swipe`. The deck should show 11 dogs nearby. Header says "Matches · 4" (the demo trigger pre-liked 4 of them). The yellow MATCHES count is the assertion that the demo trigger ran.
9. Tap "Like" on the first card (or drag right). MatchModal fires with "Princess & {Dog Name}".
10. Tap "Say hi to {OwnerName}". Lands in `/chat/<id>`. Empty chat with input.
11. Type a message, tap the yellow `↑`. Bubble appears.

If any step fails, the regression is on you.

## App Store / TestFlight readiness — what's still missing

Auth-related blockers for a real launch (not your job today, but useful context):

- **Sign in with Apple** — Apple requires it when *any* third-party auth is offered. Needs the Apple Developer Program ($99/yr).
- **Account deletion** — required by Apple guideline 5.1.1(v) and GDPR/CCPA. Not implemented.
- **Privacy policy + ToS** — required by Apple review. Must explicitly disclose AI video generation and Fal.ai as a processor.

If a future task is "implement account deletion", the cascade behavior of `delete from auth.users where id = '<uuid>'` already exists (every dependent table has `ON DELETE CASCADE` on the FK to profiles or auth.users). The hard part is the UI confirmation flow + the App Store-mandated 30-day grace period if the user changes their mind. Plan for it; don't just expose a "delete" button.

## What `auth-store.ts` does (and doesn't)

`lib/auth-store.ts` exposes:

```ts
{
  session: Session | null,
  isInitialized: boolean,
  initialize: () => Promise<void>,    // call once at root
  signOut: () => Promise<void>,
}
```

It does NOT:
- Refresh tokens manually (supabase-js handles it)
- Provide user-profile data (use `useMyDog` or write a `useProfile` query for that)
- Persist anything itself (storage is supabase-js's responsibility)

If you need authenticated user metadata in a screen, prefer `session?.user.id` + a TanStack query rather than expanding the auth-store. Auth state should stay minimal.
