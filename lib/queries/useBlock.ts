import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

type BlockArgs = {
  blockerId: string;
  blockedId: string;
};

export function useBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ blockerId, blockedId }: BlockArgs) => {
      const { error } = await supabase
        .from('blocks')
        .insert({ blocker_id: blockerId, blocked_id: blockedId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['nearby-dogs'] });
    },
  });
}
