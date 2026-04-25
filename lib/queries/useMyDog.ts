import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * The current user's dog (1-per-owner in v1), or null if they haven't
 * onboarded yet. Drives the onboarding ↔ swipe route decision.
 */
export function useMyDog(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-dog', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
