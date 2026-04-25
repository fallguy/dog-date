// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const FAL_KEY = Deno.env.get('FAL_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const MAX_VIDEOS_PER_DOG = parseInt(Deno.env.get('MAX_VIDEOS_PER_DOG') ?? '3', 10);

const FAL_MODEL = 'fal-ai/veo3.1/lite/image-to-video';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!FAL_KEY) {
      return jsonResponse(
        { error: 'Server misconfigured: FAL_KEY missing' },
        500
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing auth' }, 401);

    // User-context client (RLS will apply to selects we want to be safe);
    // service-role client for the writes that need to bypass RLS.
    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => null);
    if (!body) return jsonResponse({ error: 'Invalid JSON body' }, 400);

    const { dog_id, prompt, scenario } = body as {
      dog_id?: string;
      prompt?: string;
      scenario?: string;
    };
    if (!dog_id || typeof dog_id !== 'string') {
      return jsonResponse({ error: 'dog_id required' }, 400);
    }
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return jsonResponse({ error: 'Prompt is too short' }, 400);
    }
    if (prompt.length > 600) {
      return jsonResponse({ error: 'Prompt too long (600 char max)' }, 400);
    }

    // Validate ownership + photo
    const { data: dog, error: dogError } = await adminClient
      .from('dogs')
      .select('id, owner_id, primary_photo_url, ai_video_status')
      .eq('id', dog_id)
      .single();
    if (dogError || !dog) return jsonResponse({ error: 'Dog not found' }, 404);
    if (dog.owner_id !== userId) {
      return jsonResponse({ error: 'Not your dog' }, 403);
    }
    if (!dog.primary_photo_url) {
      return jsonResponse({ error: 'Dog has no photo yet' }, 400);
    }
    if (dog.ai_video_status === 'pending') {
      return jsonResponse({ error: 'Already generating' }, 409);
    }

    // Cost cap: max generations per dog
    const { count, error: countError } = await adminClient
      .from('video_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('dog_id', dog_id);
    if (countError) {
      return jsonResponse({ error: countError.message }, 500);
    }
    if (count !== null && count >= MAX_VIDEOS_PER_DOG) {
      return jsonResponse(
        {
          error: `This dog has hit the ${MAX_VIDEOS_PER_DOG}-video limit. Bump MAX_VIDEOS_PER_DOG in supabase/functions/.env to allow more.`,
        },
        429
      );
    }

    // Download the photo and re-encode as a base64 data URI so Fal can fetch
    // it without needing a public URL. (Local Supabase Storage isn't
    // reachable from Fal's servers.)
    const photoResp = await fetch(dog.primary_photo_url);
    if (!photoResp.ok) {
      return jsonResponse(
        { error: `Could not fetch dog photo: ${photoResp.status}` },
        500
      );
    }
    const photoBytes = new Uint8Array(await photoResp.arrayBuffer());
    const photoB64 = encodeBase64(photoBytes);
    const contentType = photoResp.headers.get('content-type') ?? 'image/jpeg';
    const dataUri = `data:${contentType};base64,${photoB64}`;

    // Submit to Fal Queue API
    const submitResp = await fetch(`https://queue.fal.run/${FAL_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: dataUri,
        prompt: prompt.trim(),
        aspect_ratio: '1:1',
      }),
    });

    if (!submitResp.ok) {
      const errBody = await submitResp.text();
      return jsonResponse(
        { error: `Fal submit failed: ${submitResp.status} ${errBody}` },
        500
      );
    }

    const falJob: any = await submitResp.json();
    const falRequestId: string = falJob.request_id;
    if (!falRequestId) {
      return jsonResponse(
        { error: `Fal submit returned no request_id: ${JSON.stringify(falJob)}` },
        500
      );
    }

    // Record job
    const { data: job, error: jobError } = await adminClient
      .from('video_jobs')
      .insert({
        dog_id,
        provider: FAL_MODEL,
        fal_request_id: falRequestId,
        prompt: prompt.trim(),
        scenario: scenario ?? 'custom',
        status: 'pending',
      })
      .select('id')
      .single();
    if (jobError) {
      return jsonResponse({ error: `DB insert: ${jobError.message}` }, 500);
    }

    // Flip dog status
    const { error: updateError } = await adminClient
      .from('dogs')
      .update({
        ai_video_status: 'pending',
        ai_video_prompt: prompt.trim(),
        ai_video_scenario: scenario ?? 'custom',
      })
      .eq('id', dog_id);
    if (updateError) {
      return jsonResponse({ error: `Dog update: ${updateError.message}` }, 500);
    }

    return jsonResponse({
      video_job_id: job.id,
      fal_request_id: falRequestId,
      status: 'pending',
    });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
