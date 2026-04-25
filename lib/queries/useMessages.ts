import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name: string | null;
};

type MessageRow = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender: { display_name: string | null } | null;
};

export function useMessages(matchId: string | undefined) {
  return useQuery({
    queryKey: ['messages', matchId],
    enabled: !!matchId,
    queryFn: async (): Promise<Message[]> => {
      if (!matchId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('id, match_id, sender_id, body, created_at, sender:sender_id(display_name)')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as unknown as MessageRow[];
      return rows.map((row) => ({
        id: row.id,
        match_id: row.match_id,
        sender_id: row.sender_id,
        body: row.body,
        created_at: row.created_at,
        sender_name: row.sender?.display_name ?? null,
      }));
    },
  });
}
