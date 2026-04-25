// Run with: deno test --allow-net --allow-env
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const URL = 'http://localhost:54321/functions/v1/generate-dog-video';

Deno.test('rejects request without auth header', async () => {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ dog_id: 'x', prompt: 'a happy dog running in a field' }),
  });
  await res.body?.cancel();
  assertEquals(res.status, 401);
});

Deno.test('rejects request with invalid dog_id', async () => {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      dog_id: '00000000-0000-0000-0000-000000000000',
      prompt: 'a happy dog running in a field',
    }),
  });
  await res.body?.cancel();
  // 401 (anon key has no user) or 404 (dog not found) are both acceptable smoke signals.
  if (res.status !== 401 && res.status !== 404) {
    throw new Error(`Expected 401 or 404, got ${res.status}`);
  }
});
