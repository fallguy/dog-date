import { describe, it } from 'vitest';

// Integration test stub — real run requires local Supabase + seeded auth session.
// Setting up an authenticated supabase-js client in jsdom is non-trivial:
// it requires injecting a real JWT (signed with the local anon JWT secret) into
// the global supabase singleton, which would also need to bypass the AsyncStorage
// session cache the client uses on web. Out of scope for this stub.
// Skip cleanly when SUPABASE_URL is unset so `npm test` works in any env.

const HAS_LOCAL_DB = !!process.env.SUPABASE_URL;
const maybeIt = HAS_LOCAL_DB ? it : it.skip;

describe('useNearbyDogs (integration)', () => {
  maybeIt('excludes the current user own dog and orders by distance', async () => {
    // TODO: implement when an auth-helper for tests exists.
    // 1. Create a session via supabase admin API for a known seed user.
    // 2. Render the hook in renderHook + QueryClientProvider.
    // 3. waitFor results; assert no dog has owner_id === currentUserId.
    // 4. Assert dogs are returned in ascending distanceMiles order.
  });
});
