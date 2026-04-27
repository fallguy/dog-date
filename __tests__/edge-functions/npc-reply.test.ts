// Run with: deno test --allow-net --allow-env
// Validation-only — no happy path because that would call OpenAI.
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const URL = 'http://localhost:54321/functions/v1/npc-reply';

Deno.test('rejects request without auth', async () => {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ match_id: '00000000-0000-0000-0000-000000000000' }),
  });
  await res.body?.cancel();
  assertEquals(res.status, 401);
});

Deno.test('rejects missing match_id with 400', async () => {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({}),
  });
  await res.body?.cancel();
  assertEquals(res.status, 400);
});
