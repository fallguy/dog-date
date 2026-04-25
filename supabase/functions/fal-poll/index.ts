// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const FAL_KEY = Deno.env.get('FAL_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Fal Queue API quirk: submission goes to the operation path
// (`fal-ai/veo3.1/lite/image-to-video`), but status and result calls
// live on the parent app slug. Hardcoded here; if we change models,
// update this together with FAL_MODEL in generate-dog-video.
const FAL_APP = 'fal-ai/veo3.1';

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

    const { video_job_id } = body as { video_job_id?: string };
    if (!video_job_id) {
      return jsonResponse({ error: 'video_job_id required' }, 400);
    }

    // Load job + check ownership via the dog row
    const { data: job, error: jobError } = await adminClient
      .from('video_jobs')
      .select('id, dog_id, fal_request_id, status, dogs(owner_id)')
      .eq('id', video_job_id)
      .single();
    if (jobError || !job) {
      return jsonResponse({ error: 'Job not found' }, 404);
    }
    const ownerId = (job.dogs as { owner_id: string } | null)?.owner_id;
    if (ownerId !== userId) {
      return jsonResponse({ error: 'Not your job' }, 403);
    }

    if (job.status !== 'pending') {
      // Already finalized; return cached result by reading dog row
      const { data: dog } = await adminClient
        .from('dogs')
        .select('ai_video_url, ai_video_status')
        .eq('id', job.dog_id)
        .single();
      return jsonResponse({
        status: job.status,
        video_url: dog?.ai_video_url ?? null,
      });
    }

    // Ask Fal for status
    const statusResp = await fetch(
      `https://queue.fal.run/${FAL_APP}/requests/${job.fal_request_id}/status`,
      {
        headers: { Authorization: `Key ${FAL_KEY}` },
      }
    );
    if (!statusResp.ok) {
      const errBody = await statusResp.text();
      return jsonResponse(
        { error: `Fal status check failed: ${statusResp.status} ${errBody}` },
        500
      );
    }
    const statusData: any = await statusResp.json();
    const falStatus: string = statusData.status; // IN_QUEUE | IN_PROGRESS | COMPLETED

    if (falStatus === 'IN_QUEUE' || falStatus === 'IN_PROGRESS') {
      return jsonResponse({
        status: 'pending',
        fal_status: falStatus,
        queue_position: statusData.queue_position ?? null,
      });
    }

    if (falStatus === 'COMPLETED') {
      // Fetch the result
      const resultResp = await fetch(
        `https://queue.fal.run/${FAL_APP}/requests/${job.fal_request_id}`,
        { headers: { Authorization: `Key ${FAL_KEY}` } }
      );
      if (!resultResp.ok) {
        const errBody = await resultResp.text();
        return jsonResponse(
          { error: `Fal result fetch failed: ${resultResp.status} ${errBody}` },
          500
        );
      }
      const result: any = await resultResp.json();
      const videoUrl: string | undefined = result?.video?.url;
      if (!videoUrl) {
        return jsonResponse(
          { error: `Fal returned no video URL: ${JSON.stringify(result)}` },
          500
        );
      }

      // Persist on dog row
      await adminClient
        .from('dogs')
        .update({
          ai_video_url: videoUrl,
          ai_video_status: 'ready',
        })
        .eq('id', job.dog_id);

      // Persist on job row
      await adminClient
        .from('video_jobs')
        .update({
          status: 'ready',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return jsonResponse({ status: 'ready', video_url: videoUrl });
    }

    // Anything else (errors): mark failed
    const errorText = JSON.stringify(statusData);
    await adminClient
      .from('dogs')
      .update({ ai_video_status: 'failed' })
      .eq('id', job.dog_id);
    await adminClient
      .from('video_jobs')
      .update({
        status: 'failed',
        error: errorText,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    return jsonResponse({ status: 'failed', error: errorText });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
