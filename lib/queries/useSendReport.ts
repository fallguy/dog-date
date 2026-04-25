import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

type SendReportArgs = {
  reporterId: string;
  targetId: string;
  reason: string;
};

export function useSendReport() {
  return useMutation({
    mutationFn: async ({ reporterId, targetId, reason }: SendReportArgs) => {
      const { error } = await supabase
        .from('reports')
        .insert({ reporter_id: reporterId, target_id: targetId, reason });
      if (error) throw error;
    },
  });
}
