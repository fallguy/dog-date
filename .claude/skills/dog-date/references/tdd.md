# TDD on Dog Date — starting from zero

The app currently has zero tests. That's a problem, not a feature. This reference is the harness recipe so a new agent can write the *first* test for any layer in under five minutes. Once the harness exists, every subsequent test is the cheap part.

## Why TDD here

- **The signature feature (AI video pipeline) is async + paid.** A regression that costs $0.30 per misfire deserves a test that costs $0 to run.
- **The match trigger is a Postgres trigger.** Triggers are exactly the kind of thing humans miss in code review — easy to test in SQL, easy to break silently.
- **The web bundle landmine.** `npm run check:web` is already a parse-time test. Add to it; don't go around it.
- **Demo confidence.** The demo flow (sign in → onboard → swipe → match → chat) is the resume of this app. A 60-second test run that exercises end-to-end gives you license to refactor without fear.

## What to test, in priority order

1. **Postgres triggers and RLS** — `create_match_on_mutual_like`, `handle_new_user`, `demo_pre_like_new_dog`, the dogs SELECT policy that hides blocked relationships. SQL test scripts.
2. **Edge functions** — `generate-dog-video` (input validation, cost cap, photo download), `fal-poll` (status mapping), `notify` (token fan-out). Deno tests.
3. **TanStack query hooks** — `useNearbyDogs` exclusion logic, `useInsertSwipe` match detection, `useMatches` ordering, `mapDogRowToCard`. Vitest with mocked supabase client (for unit) or live local supabase (for integration).
4. **Components and screens** — DogCard rendering by state (photo / video / video-pending), SwipeDeck pan gesture thresholds, MatchModal CTA wiring. React Native Testing Library + jsdom.
5. **End-to-end demo flow** — Playwright against the running web preview. Slow but high-signal.

Don't try to do them all at once. Pick the layer your change touches and add a test there.

## Layer 1: SQL trigger tests (already a working harness)

`__tests__/sql/match-trigger.test.sql` is the pattern. It's a `psql` script wrapped in `begin; ... rollback;` so it leaves no traces.

Run with:

```bash
psql "postgres://postgres:postgres@localhost:54322/postgres" \
  -v ON_ERROR_STOP=1 \
  -f __tests__/sql/match-trigger.test.sql
```

A non-zero exit code means a `raise exception` fired — i.e. a test failed.

### Pattern

```sql
\set ON_ERROR_STOP on
begin;

-- Setup: insert minimal auth.users + dogs.
-- Use a uuid prefix outside both 11111111 (demo seed) and any real test fixture.
-- The demo_pre_like_new_dog trigger fires on every dogs insert; clear those if
-- they would interfere with what you're about to assert.

-- Test 1: <plain-English claim>
-- (insert state, assert outcome with `do $$ ... if not <expected> then raise
-- exception 'description'; end if; end $$;`)

-- Test 2: <next claim>
-- ...

rollback;
```

Key things to remember:

- **Always wrap in `begin; ... rollback;`** so tests are idempotent. Migrations and seed data don't change between runs.
- **Don't rely on the demo seed's UUID prefix** for fixtures — pick `99999999-…` or another distinct prefix so a future seed change can't quietly invalidate the test.
- **Clear the demo trigger's pre-likes** for your test dogs (`delete from public.swipes where target_dog_id = '<test-dog-id>';`) before asserting, otherwise mutual-like assertions get noise.
- **Run after every migration change.** A two-line `package.json` script (`"test:sql": "psql ... -f ..."`) is enough.

Where to put new SQL tests: `__tests__/sql/<feature>.test.sql`. One file per migration or trigger.

## Layer 2: Edge function tests (Deno)

`__tests__/edge-functions/generate-dog-video.test.ts` and `fal-poll.test.ts` are already there as integration smoke tests. They assume `supabase functions serve` is running. Run with:

```bash
deno test --allow-net --allow-env __tests__/edge-functions/
```

For pure unit tests of the edge function logic (no Supabase running), refactor the handler to export a pure function that takes a `Request` and returns a `Response`, then test that function directly. The current handlers are inline in `Deno.serve(...)` which makes them hard to unit test — that's a deliberate refactor opportunity.

### Pattern (integration)

```ts
import { assertEquals } from 'https://deno.land/std/assert/mod.ts';

const FN_URL = 'http://localhost:54321/functions/v1/<name>';

Deno.test('rejects request without auth', async () => {
  const r = await fetch(FN_URL, { method: 'POST', body: '{}' });
  assertEquals(r.status, 401);
});

Deno.test('rejects request with invalid body', async () => {
  const r = await fetch(FN_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer fake', 'content-type': 'application/json' },
    body: 'not json',
  });
  assertEquals(r.status, 400);
});
```

Key things to remember:

- **Skip the happy path on Fal-calling functions.** The cost cap is per-dog, but Fal still bills for invalid inputs that get past the cap. Use the dry-run path or stub Fal at the network layer (Deno test fetch interception).
- **Don't mock Supabase.** Run `supabase start` and hit the real local stack. Mocked DB tests give false confidence — they verify the mock, not the schema.

## Layer 3: TanStack query / lib unit tests

The project has no test runner configured for TS yet. The lowest-friction setup:

```bash
npm install -D vitest @testing-library/jest-dom
```

Add to `package.json`:

```json
"scripts": {
  "test": "vitest"
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';   // optional, only if you also test React
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',                    // required for React Native Web
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': '/Users/bporter/Documents/funProjects/dog-date',
      'react-native': 'react-native-web',
    },
  },
});
```

Why these choices:
- **Vitest** because it's faster than Jest and shares Vite's ESM behavior, avoiding the `import.meta` web-bundle landmine.
- **jsdom** because React Native Web renders to DOM.
- **`react-native` aliased to `react-native-web`** so component imports resolve. Same trick Metro uses internally.

### Pattern

`lib/__tests__/demo-dogs.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mapDogRowToCard, type DogRow } from '@/lib/demo-dogs';

describe('mapDogRowToCard', () => {
  const baseRow: DogRow = {
    id: 'd1', name: 'Test', breed: 'Mix', birthdate: null,
    size: 'Medium', energy: 'High', tags: [], notes: null,
    primary_photo_url: 'https://example.com/p.jpg',
    photos: null, ai_video_url: null, ai_video_status: 'idle', owner: null,
  };

  it('emits videoUrl only when status is ready', () => {
    expect(mapDogRowToCard({ ...baseRow, ai_video_url: 'x', ai_video_status: 'pending' }).videoUrl)
      .toBeUndefined();
    expect(mapDogRowToCard({ ...baseRow, ai_video_url: 'x', ai_video_status: 'ready' }).videoUrl)
      .toBe('x');
  });

  it('falls back to primary_photo_url when photos[] is empty', () => {
    expect(mapDogRowToCard(baseRow).photos).toEqual(['https://example.com/p.jpg']);
  });
});
```

Key things to remember:

- **Test the mapper, not the query.** `mapDogRowToCard` is pure; mock-free tests are robust. The `useNearbyDogs` query wraps it — that one needs an integration test (next bullet).
- **For query hooks, prefer integration over mocking.** Spin up `supabase start`, seed test data, run the hook in a `renderHook` from `@testing-library/react`. Mocking the supabase client gives you tests that pass while the real query is broken.
- **Keep the mock-free principle from the implementer agent.** "Tests that test mocked behavior" are a code smell. The agent style guide is explicit about this.

## Layer 4: Component / screen tests

```bash
npm install -D @testing-library/react-native
```

Use `render`, `fireEvent`, `screen` from RNTL. Most things work the same as React Testing Library.

### Pattern

`components/__tests__/DogCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import { DogCard } from '@/components/DogCard';
import type { Dog } from '@/lib/demo-dogs';

const dog: Dog = {
  id: '1', name: 'Biscuit', breed: 'Golden Retriever', ageYears: 3,
  size: 'Large', energy: 'High', tags: ['fetch'], bio: 'tennis ball',
  photo: 'p.jpg', photos: ['p.jpg'], ownerName: 'Maya', ownerBio: '',
  distanceMiles: 0,
};

test('renders dog name and meta', () => {
  render(<DogCard dog={dog} />);
  expect(screen.getByText('Biscuit')).toBeTruthy();
  expect(screen.getByText(/Golden Retriever/)).toBeTruthy();
});

test('shows AI badge only when videoUrl is present', () => {
  const { rerender, queryByText } = render(<DogCard dog={dog} />);
  expect(queryByText('AI')).toBeNull();
  rerender(<DogCard dog={{ ...dog, videoUrl: 'v.mp4' }} />);
  expect(queryByText('AI')).toBeTruthy();
});
```

Key things to remember:

- **The pointer-events fix lives in DogCard.** A regression test that asserts `<View pointerEvents="none">` wraps the Image and VideoView is worth its weight — that bug ate hours.
- **`expo-video`'s `useVideoPlayer` may not work cleanly in jsdom.** Mock it minimally if needed: `vi.mock('expo-video', () => ({ useVideoPlayer: () => ({}), VideoView: () => null }));`. This is mocking the framework boundary, not your own logic — acceptable.
- **Test the deck's imperative `swipe()` method.** SwipeDeck exposes `swipe(direction)` via `forwardRef`. A test that calls it and asserts `onSwiped` was invoked with the right dog locks down the contract that the Pass/Like buttons rely on.

## Layer 5: End-to-end demo flow (Playwright)

```bash
npm install -D @playwright/test
npx playwright install chromium
```

`__tests__/e2e/demo-flow.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('demo flow: sign in, onboard, swipe, match, message', async ({ page }) => {
  await page.goto('http://localhost:8081/');
  await page.fill('input[placeholder="you@example.com"]', `demo+${Date.now()}@example.local`);
  await page.click('text=Send sign-in code');

  // grab OTP from Mailpit
  const mp = await fetch('http://localhost:54324/api/v1/messages').then((r) => r.json());
  const code = mp.messages[0].Snippet.match(/code: (\d{6})/)![1];

  await page.fill('input[placeholder="123456"]', code);
  await page.click('text=Sign in');

  // onboarding...
  // ...assertions
});
```

Key things to remember:

- **Reset the user between runs.** `node scripts/reset-user.mjs --all-non-demo` in a `globalSetup`. Otherwise the e2e accumulates state.
- **Mailpit is your friend.** OTP retrieval via the REST API at `http://localhost:54324/api/v1/messages` is the cheapest way to get past auth in tests.
- **E2E covers what unit tests can't.** Realtime channels, gesture handler, video playback. Don't try to unit-test those — they're integration concerns.

## What test failures mean

From the implementer agent style:
- "ALL TEST FAILURES ARE YOUR RESPONSIBILITY, even if they're not your fault."
- "Never delete a test because it's failing. Fix the test or the code."
- "Test output MUST BE PRISTINE TO PASS." If a test prints unexpected console errors, capture and assert on them — don't silence.
- "Never write tests that test mocked behavior." If you find one, flag it.

If a flaky test exists, fix the flake before merging anything else. The Broken Windows theory is real.

## A reasonable first PR if you're starting tests from scratch

1. Add `vitest` + `@testing-library/react-native` + `@playwright/test` dev deps.
2. Add `vitest.config.ts`, `vitest.setup.ts`, and `playwright.config.ts`.
3. Add npm scripts: `test`, `test:sql`, `test:edge`, `test:e2e`.
4. Write one test per layer (the patterns above):
   - SQL: match-trigger (already exists; verify it runs)
   - Edge: `notify` happy path
   - Lib: `mapDogRowToCard`
   - Component: DogCard renders + AI badge
   - E2E: sign-in → onboarding (skip swipe initially)
5. Document `npm test` in CLAUDE.md.

That's a couple hours of work and it pays back the first time someone refactors `useNearbyDogs` and the deck breaks at 2am.
