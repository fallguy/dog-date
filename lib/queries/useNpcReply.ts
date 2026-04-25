import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * Best-effort wrapper around the `npc-reply` edge function. The edge function
 * decides whether the other side of the match is an NPC; if not, it returns
 * `{ skipped: 'not_npc' }` and we silently no-op. Errors are swallowed so a
 * failure here never breaks the user's outgoing message.
 */
export async function triggerNpcReply(matchId: string): Promise<void> {
  try {
    await supabase.functions.invoke('npc-reply', { body: { match_id: matchId } });
  } catch {
    // Silent — NPC replies are best-effort.
  }
}

export function useNpcReply() {
  return useMutation({
    mutationFn: async ({ matchId }: { matchId: string }) => {
      await triggerNpcReply(matchId);
    },
  });
}
