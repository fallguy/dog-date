import { describe, it } from 'vitest';

// Integration test stub — see useNearbyDogs.test.ts for the same reasoning.
// Inserting a swipe requires an authenticated supabase-js session because RLS
// gates the swipes table. Without a test auth-helper we'd be testing mocks,
// which tdd.md explicitly cautions against.

const HAS_LOCAL_DB = !!process.env.SUPABASE_URL;
const maybeIt = HAS_LOCAL_DB ? it : it.skip;

describe('useInsertSwipe (integration)', () => {
  maybeIt('returns matched=true when a mutual like exists', async () => {
    // TODO: implement when an auth-helper for tests exists.
    // 1. Sign in two seed users via supabase admin API.
    // 2. From userA: insert swipe (dogA -> dogB, like). Assert matched=false.
    // 3. From userB: insert swipe (dogB -> dogA, like). Assert matched=true and matchId set.
  });
});
