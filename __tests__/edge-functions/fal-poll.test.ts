// Run with: deno test --allow-net --allow-env
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const URL = 'http://localhost:54321/functions/v1/fal-poll';

Deno.test('rejects request missing video_job_id', async () => {
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

Deno.test('returns error for non-existent video_job_id', async () => {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ video_job_id: '00000000-0000-0000-0000-000000000000' }),
  });
  await res.body?.cancel();
  if (res.status < 400) {
    throw new Error(`Expected error status (>=400), got ${res.status}`);
  }
});
