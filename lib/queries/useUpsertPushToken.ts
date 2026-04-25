import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

type UpsertArgs = {
  userId: string;
  expoToken: string;
  deviceLabel?: string;
};

export function useUpsertPushToken() {
  return useMutation({
    mutationFn: async ({ userId, expoToken, deviceLabel }: UpsertArgs) => {
      const { error } = await supabase.from('push_tokens').upsert(
        {
          user_id: userId,
          expo_token: expoToken,
          device_label: deviceLabel ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,expo_token' }
      );
      if (error) throw error;
    },
  });
}
