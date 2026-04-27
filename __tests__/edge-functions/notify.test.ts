// Run with: deno test --allow-net --allow-env
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const URL = 'http://localhost:54321/functions/v1/notify';

// notify/index.ts has no explicit auth check, but `supabase functions serve`
// (without --no-verify-jwt) gates every function with a JWT check that fails
// with 401 before reaching the handler. The repo's docs run serve with
// --no-verify-jwt, in which case the runtime returns 401 itself when no
// Authorization header is present. Either way: no auth → 401.
Deno.test('rejects request without auth', async () => {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  await res.body?.cancel();
  assertEquals(res.status, 401);
});

Deno.test('rejects invalid JSON body with 400', async () => {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: 'not json',
  });
  await res.body?.cancel();
  assertEquals(res.status, 400);
});

Deno.test('rejects missing required fields with 400', async () => {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ recipient_user_id: '00000000-0000-0000-0000-000000000000' }),
  });
  await res.body?.cancel();
  assertEquals(res.status, 400);
});
