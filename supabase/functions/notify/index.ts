import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface NotifyBody {
  recipient_user_id?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const parsed = (await req.json().catch(() => null)) as NotifyBody | null;
    if (!parsed) return jsonResponse({ error: 'Invalid JSON body' }, 400);

    const { recipient_user_id, title, body, data } = parsed;
    if (!recipient_user_id || !title || !body) {
      return jsonResponse({ error: 'missing fields' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('expo_token')
      .eq('user_id', recipient_user_id);

    if (error) return jsonResponse({ error: error.message }, 500);
    if (!tokens || tokens.length === 0) {
      return jsonResponse({ sent: 0 });
    }

    const messages = tokens.map((t: { expo_token: string }) => ({
      to: t.expo_token,
      sound: 'default',
      title,
      body,
      data,
    }));

    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(messages),
    });
    const expoBody = await expoRes.json();

    return jsonResponse({ sent: tokens.length, expo: expoBody });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
