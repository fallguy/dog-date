#!/usr/bin/env node
// One-shot: generate AI videos for the first 3 demo dogs (Biscuit, Pickle, Juno)
// so the swipe deck shows looping AI videos for other people's dogs.
// Costs ~$0.30 × 3 = ~$0.90. Re-running skips dogs that already have a video.

import fs from 'node:fs';
import { execSync } from 'node:child_process';

const ROOT = new URL('../', import.meta.url).pathname;
const ENV_FILE = ROOT + 'supabase/functions/.env';
const FAL_KEY = fs.readFileSync(ENV_FILE, 'utf8').match(/FAL_KEY=(.+)/)?.[1]?.trim();
if (!FAL_KEY) {
  console.error('FAL_KEY missing in', ENV_FILE);
  process.exit(1);
}

const DB_URL = 'postgres://postgres:postgres@localhost:54322/postgres';
const FAL_MODEL = 'fal-ai/veo3.1/lite/image-to-video';
const FAL_APP = 'fal-ai/veo3.1';

const PROMPTS = {
  pilot: (breed) =>
    `A ${breed} dog wearing aviator goggles and a leather flight helmet, piloting a tiny vintage propeller airplane through fluffy clouds, cinematic close-up, golden hour lighting, viral social media style, 5 seconds`,
  chef: (breed) =>
    `A ${breed} dog wearing a tall white chef hat, busy in a cozy kitchen flipping a small pancake in a pan, steam rising, warm soft lighting, viral social media style, 5 seconds`,
  surfer: (breed) =>
    `A ${breed} dog confidently surfing on a small surfboard riding a sunlit ocean wave, salt spray, ears flapping in the wind, cinematic, viral social media style, 5 seconds`,
  yoga: (breed) =>
    `A ${breed} dog calmly holding a yoga pose on a colorful mat in a sunlit studio, soft natural light from the window, peaceful expression, cinematic, viral social media style, 5 seconds`,
  skater: (breed) =>
    `A ${breed} dog confidently skateboarding through a sunlit suburban street, paws on the deck, ears flapping, golden hour lighting, viral social media style, 5 seconds`,
  pianist: (breed) =>
    `A ${breed} dog sitting at a grand piano, paws on the keys, gently swaying with the music, warm spotlight in a cozy concert hall, cinematic, viral social media style, 5 seconds`,
  astronaut: (breed) =>
    `A ${breed} dog wearing a tiny custom astronaut suit, floating gently inside a spaceship cockpit with stars visible through the window, cinematic, viral social media style, 5 seconds`,
  dj: (breed) =>
    `A ${breed} dog wearing oversized headphones, paws on a glowing DJ turntable, colorful club lights pulsing, smoke effects, viral social media style, 5 seconds`,
  'horse-rider': (breed) =>
    `A ${breed} dog confidently riding a small pony through a green meadow at sunset, ears flapping in the breeze, cinematic, viral social media style, 5 seconds`,
  lemonade: (breed) =>
    `A ${breed} dog behind a small wooden lemonade stand on a sunny suburban sidewalk, a wagging tail, colorful sign, kids approaching, warm cinematic lighting, viral social media style, 5 seconds`,
  frisbee: (breed) =>
    `A ${breed} dog mid-leap catching a frisbee at a sunlit beach, sand spray under paws, ocean in the background, cinematic slow motion, viral social media style, 5 seconds`,
};

const assignments = [
  { ownerId: '11111111-1111-1111-1111-111111111101', scenario: 'pilot' },        // Biscuit
  { ownerId: '11111111-1111-1111-1111-111111111102', scenario: 'chef' },         // Pickle
  { ownerId: '11111111-1111-1111-1111-111111111103', scenario: 'surfer' },       // Juno
  { ownerId: '11111111-1111-1111-1111-111111111104', scenario: 'yoga' },         // Moose
  { ownerId: '11111111-1111-1111-1111-111111111105', scenario: 'skater' },       // Scout
  { ownerId: '11111111-1111-1111-1111-111111111106', scenario: 'pianist' },      // Ruby
  { ownerId: '11111111-1111-1111-1111-111111111107', scenario: 'astronaut' },    // Kobe
  { ownerId: '11111111-1111-1111-1111-111111111108', scenario: 'dj' },           // Waffles
  { ownerId: '11111111-1111-1111-1111-111111111109', scenario: 'horse-rider' },  // Sir Reginald
  { ownerId: '11111111-1111-1111-1111-111111111110', scenario: 'lemonade' },     // Snickerdoodle
  { ownerId: '11111111-1111-1111-1111-111111111111', scenario: 'frisbee' },      // Juniper-Belle
].map((a) => ({ ...a, prompt: PROMPTS[a.scenario] }));

function psql(sql) {
  // Pipe SQL via stdin instead of -c so bash never sees the body. Without this
  // the `$$ ... $$` dollar-quoted prompt strings in the SQL get expanded by
  // bash to the shell's PID before psql ever parses them.
  return execSync(`psql "${DB_URL}" -At -F '|'`, {
    encoding: 'utf8',
    input: sql,
  }).trim();
}

const dogs = [];
for (const a of assignments) {
  const row = psql(
    `select id, primary_photo_url, breed, name, ai_video_status from public.dogs where owner_id = '${a.ownerId}';`
  );
  if (!row) {
    console.warn(`Dog not found for owner ${a.ownerId}; skipping`);
    continue;
  }
  const [id, photo, breed, name, status] = row.split('|');
  if (status === 'ready') {
    console.log(`✓ ${name} already has a video; skipping`);
    continue;
  }
  dogs.push({
    id,
    photo,
    breed,
    name,
    scenario: a.scenario,
    prompt: a.prompt(breed),
  });
}

if (dogs.length === 0) {
  console.log('Nothing to do.');
  process.exit(0);
}

console.log('Generating for:', dogs.map((d) => `${d.name} (${d.scenario})`).join(', '));

async function submitVideo(dog) {
  const photoResp = await fetch(dog.photo);
  if (!photoResp.ok) throw new Error(`photo ${dog.name}: ${photoResp.status}`);
  const buf = Buffer.from(await photoResp.arrayBuffer());
  const ct = photoResp.headers.get('content-type') ?? 'image/jpeg';
  const dataUri = `data:${ct};base64,${buf.toString('base64')}`;

  const r = await fetch(`https://queue.fal.run/${FAL_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: dataUri,
      prompt: dog.prompt,
      aspect_ratio: '9:16',
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`submit ${dog.name}: ${r.status} ${t}`);
  }
  const job = await r.json();
  if (!job.request_id) {
    throw new Error(`submit ${dog.name}: no request_id ${JSON.stringify(job)}`);
  }
  return job.request_id;
}

const submitted = [];
for (const dog of dogs) {
  try {
    const requestId = await submitVideo(dog);
    submitted.push({ ...dog, requestId, status: 'pending' });
    psql(
      `insert into public.video_jobs (dog_id, provider, fal_request_id, prompt, scenario, status) values ('${dog.id}', '${FAL_MODEL}', '${requestId}', $$${dog.prompt}$$, '${dog.scenario}', 'pending');`
    );
    psql(
      `update public.dogs set ai_video_status = 'pending', ai_video_prompt = $$${dog.prompt}$$, ai_video_scenario = '${dog.scenario}' where id = '${dog.id}';`
    );
    console.log(`  → ${dog.name}: submitted ${requestId}`);
  } catch (e) {
    console.error(`  ✗ ${dog.name}: ${e.message}`);
  }
}

const start = Date.now();
async function pollOnce(job) {
  const r = await fetch(
    `https://queue.fal.run/${FAL_APP}/requests/${job.requestId}/status`,
    { headers: { Authorization: `Key ${FAL_KEY}` } }
  );
  const data = await r.json();
  if (data.status === 'COMPLETED') {
    const rr = await fetch(
      `https://queue.fal.run/${FAL_APP}/requests/${job.requestId}`,
      { headers: { Authorization: `Key ${FAL_KEY}` } }
    );
    const result = await rr.json();
    const url = result?.video?.url;
    if (!url) {
      console.error(`  ✗ ${job.name}: no url ${JSON.stringify(result)}`);
      job.status = 'failed';
      psql(`update public.dogs set ai_video_status = 'failed' where id = '${job.id}';`);
      return;
    }
    psql(
      `update public.dogs set ai_video_url = '${url}', ai_video_status = 'ready' where id = '${job.id}';`
    );
    psql(
      `update public.video_jobs set status = 'ready', completed_at = now() where fal_request_id = '${job.requestId}';`
    );
    job.status = 'ready';
    job.videoUrl = url;
    console.log(
      `  ✓ ${job.name}: READY in ${Math.round((Date.now() - start) / 1000)}s`
    );
  } else if (data.status === 'IN_QUEUE' || data.status === 'IN_PROGRESS') {
    console.log(
      `  · ${job.name}: ${data.status} ${Math.round((Date.now() - start) / 1000)}s`
    );
  } else {
    job.status = 'failed';
    console.error(`  ✗ ${job.name}: ${JSON.stringify(data)}`);
    psql(`update public.dogs set ai_video_status = 'failed' where id = '${job.id}';`);
    psql(
      `update public.video_jobs set status = 'failed', error = $$${JSON.stringify(data).replace(/\$/g, '')}$$ where fal_request_id = '${job.requestId}';`
    );
  }
}

console.log('\nPolling…');
while (submitted.some((j) => j.status === 'pending')) {
  await new Promise((r) => setTimeout(r, 8000));
  for (const job of submitted.filter((j) => j.status === 'pending')) {
    try {
      await pollOnce(job);
    } catch (e) {
      console.error(`  ! ${job.name}: ${e.message}`);
    }
  }
}

const ready = submitted.filter((j) => j.status === 'ready');
console.log(
  `\nDone. ${ready.length}/${submitted.length} ready in ${Math.round((Date.now() - start) / 1000)}s.`
);
for (const j of ready) console.log(`  ${j.name}: ${j.videoUrl}`);
