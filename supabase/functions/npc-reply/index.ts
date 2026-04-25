// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-5.4-mini';
const NPC_EMAIL_SUFFIX = '@demo.local';
const HISTORY_LIMIT = 20;

interface NpcReplyBody {
  match_id?: string;
}

interface DogRow {
  id: string;
  name: string;
  breed: string;
  size: string;
  energy: string;
  tags: string[] | null;
  notes: string | null;
  birthdate: string | null;
  owner_id: string;
}

interface ProfileRow {
  id: string;
  display_name: string;
  bio: string | null;
}

function ageYears(birthdate: string | null): number {
  if (!birthdate) return 0;
  return Math.floor((Date.now() - new Date(birthdate).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function buildSystemPrompt(dog: DogRow, owner: ProfileRow): string {
  const tags = (dog.tags ?? []).join(', ');
  const lines = [
    `You are ${owner.display_name}, owner of ${dog.name}, a ${ageYears(dog.birthdate)}-year-old ${dog.size} ${dog.energy}-energy ${dog.breed}.`,
    `About ${dog.name}: ${dog.notes ?? '(no notes)'}`,
    `About you: ${owner.bio ?? '(no bio)'}`,
    tags ? `Tags: ${tags}` : '',
    `You're texting another dog owner through a dog-meetup app. Reply naturally — warm, casual, 1-2 short sentences. Occasional emoji ok but sparingly.`,
    `Reference ${dog.name} by name when natural. Never break character. Never mention being an AI. If they propose meeting up, agree enthusiastically and suggest a nearby park or time.`,
  ];
  return lines.filter(Boolean).join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return jsonResponse({ error: 'Server misconfigured: OPENAI_API_KEY missing' }, 500);
    }
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing auth' }, 401);

    const parsed = (await req.json().catch(() => null)) as NpcReplyBody | null;
    if (!parsed || !parsed.match_id) {
      return jsonResponse({ error: 'match_id required' }, 400);
    }
    const matchId = parsed.match_id;

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return jsonResponse({ error: 'Invalid token' }, 401);
    const callerId = userData.user.id;

    // Verify caller is on this match + load both dogs/owners.
    const { data: matchRow, error: matchErr } = await adminClient
      .from('matches')
      .select(
        'id, dog_a:dog_a_id(id, name, breed, size, energy, tags, notes, birthdate, owner_id), dog_b:dog_b_id(id, name, breed, size, energy, tags, notes, birthdate, owner_id)'
      )
      .eq('id', matchId)
      .maybeSingle();
    if (matchErr) return jsonResponse({ error: matchErr.message }, 500);
    const match = matchRow as unknown as { dog_a: DogRow | null; dog_b: DogRow | null } | null;
    if (!match || !match.dog_a || !match.dog_b) {
      return jsonResponse({ error: 'match not found' }, 404);
    }

    const callerIsA = match.dog_a.owner_id === callerId;
    const callerIsB = match.dog_b.owner_id === callerId;
    if (!callerIsA && !callerIsB) {
      return jsonResponse({ error: 'not a participant' }, 403);
    }
    const npcDog = callerIsA ? match.dog_b : match.dog_a;
    const npcOwnerId = npcDog.owner_id;

    // Detect NPC by auth.users email suffix.
    const { data: npcAuthRes, error: npcAuthErr } = await adminClient.auth.admin.getUserById(npcOwnerId);
    if (npcAuthErr) return jsonResponse({ error: npcAuthErr.message }, 500);
    const npcEmail = npcAuthRes?.user?.email ?? '';
    if (!npcEmail.toLowerCase().endsWith(NPC_EMAIL_SUFFIX)) {
      return jsonResponse({ skipped: 'not_npc' });
    }

    // Owner profile (display_name, bio).
    const { data: ownerProfile, error: profileErr } = await adminClient
      .from('profiles')
      .select('id, display_name, bio')
      .eq('id', npcOwnerId)
      .maybeSingle();
    if (profileErr || !ownerProfile) {
      return jsonResponse({ error: 'owner profile missing' }, 500);
    }

    // Conversation history.
    const { data: msgRows, error: msgErr } = await adminClient
      .from('messages')
      .select('id, sender_id, body, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT);
    if (msgErr) return jsonResponse({ error: msgErr.message }, 500);
    const history = (msgRows ?? []).slice().reverse();

    // Dedupe: don't reply if the most recent message is already from the NPC.
    const last = history[history.length - 1];
    if (!last) {
      return jsonResponse({ skipped: 'no_messages' });
    }
    if (last.sender_id === npcOwnerId) {
      return jsonResponse({ skipped: 'already_replied' });
    }

    const systemPrompt = buildSystemPrompt(npcDog, ownerProfile as ProfileRow);

    // Responses API input shape: assistant turns must use the explicit content
    // array with type=output_text (the simple shorthand fails validation for
    // role=assistant). User turns accept a plain string.
    type InputItem =
      | { role: 'user'; content: string }
      | { role: 'assistant'; content: { type: 'output_text'; text: string }[] };
    const input: InputItem[] = history.map((m): InputItem =>
      m.sender_id === npcOwnerId
        ? { role: 'assistant', content: [{ type: 'output_text', text: m.body }] }
        : { role: 'user', content: m.body }
    );

    // /v1/responses uses `instructions` for the system prompt, `input` for the
    // turn array, `max_output_tokens` for the cap, and `reasoning.effort` (not
    // `reasoning_effort`) for the reasoning level. gpt-5.4-mini rejects
    // `temperature`, so personality variance is left to reasoning + the prompt.
    const openaiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        instructions: systemPrompt,
        input,
        max_output_tokens: 800,
        reasoning: { effort: 'low' },
      }),
    });
    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => '');
      return jsonResponse({ error: 'openai_failed', status: openaiRes.status, detail: errText.slice(0, 500) }, 502);
    }
    const completion = (await openaiRes.json()) as any;
    // Prefer the SDK-style convenience field; fall back to walking output[].content[].
    let reply = typeof completion?.output_text === 'string' ? completion.output_text : '';
    if (!reply) {
      const outputs = Array.isArray(completion?.output) ? completion.output : [];
      const parts: string[] = [];
      for (const item of outputs) {
        if (item?.type === 'message' && Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part?.type === 'output_text' && typeof part.text === 'string') {
              parts.push(part.text);
            }
          }
        }
      }
      reply = parts.join('');
    }
    reply = reply.trim();
    if (!reply) {
      return jsonResponse({ error: 'empty_completion' }, 502);
    }
    const trimmed = reply.length > 2000 ? reply.slice(0, 2000) : reply;

    const { error: insertErr } = await adminClient.from('messages').insert({
      match_id: matchId,
      sender_id: npcOwnerId,
      body: trimmed,
    });
    if (insertErr) return jsonResponse({ error: insertErr.message }, 500);

    // Best-effort push notification to the real user.
    try {
      const { data: tokens } = await adminClient
        .from('push_tokens')
        .select('expo_token')
        .eq('user_id', callerId);
      if (tokens && tokens.length > 0) {
        const messages = tokens.map((t: { expo_token: string }) => ({
          to: t.expo_token,
          sound: 'default',
          title: `${ownerProfile.display_name}`,
          body: trimmed.slice(0, 100),
          data: { matchId },
        }));
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify(messages),
        });
      }
    } catch (_e) {
      // Push is best-effort.
    }

    return jsonResponse({ inserted: true, reply_preview: trimmed.slice(0, 80) });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
