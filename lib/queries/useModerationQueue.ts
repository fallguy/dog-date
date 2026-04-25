import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type ModerationRow = {
  report_id: string;
  reporter_id: string;
  reporter_name: string | null;
  target_id: string;
  target_name: string | null;
  reason: string;
  notes: string | null;
  status: string;
  created_at: string;
};

export function useModerationQueue() {
  return useQuery({
    queryKey: ['moderation-queue'],
    queryFn: async (): Promise<ModerationRow[]> => {
      const { data, error } = await supabase
        .from('moderation_queue')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ModerationRow[];
    },
  });
}
