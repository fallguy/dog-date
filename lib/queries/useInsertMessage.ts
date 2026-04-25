import { useMutation, useQueryClient } from '@tanstack/react-query';

import { notify } from '@/lib/queries/useNotify';
import { supabase } from '@/lib/supabase';

type InsertMessageArgs = {
  matchId: string;
  senderId: string;
  body: string;
};

type MatchOwnersRow = {
  dog_a: { owner_id: string } | null;
  dog_b: { owner_id: string } | null;
};

export function useInsertMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, senderId, body }: InsertMessageArgs) => {
      const { error } = await supabase
        .from('messages')
        .insert({ match_id: matchId, sender_id: senderId, body });
      if (error) throw error;

      const { data: matchData } = await supabase
        .from('matches')
        .select('dog_a:dog_a_id(owner_id), dog_b:dog_b_id(owner_id)')
        .eq('id', matchId)
        .maybeSingle();
      const match = matchData as unknown as MatchOwnersRow | null;
      const recipientUserId =
        match?.dog_a?.owner_id === senderId
          ? match?.dog_b?.owner_id
          : match?.dog_a?.owner_id;
      if (recipientUserId) {
        await notify({
          recipientUserId,
          title: 'New message',
          body: body.slice(0, 100),
          data: { matchId },
        });
      }
    },
    onSuccess: (_data, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
    },
  });
}
