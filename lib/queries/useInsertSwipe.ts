import { useMutation } from '@tanstack/react-query';

import { notify } from '@/lib/queries/useNotify';
import { supabase } from '@/lib/supabase';

type InsertSwipeArgs = {
  swiperDogId: string;
  targetDogId: string;
  direction: 'like' | 'pass';
};

type InsertSwipeResult = {
  matched: boolean;
  matchId: string | null;
};

export function useInsertSwipe() {
  return useMutation({
    mutationFn: async ({
      swiperDogId,
      targetDogId,
      direction,
    }: InsertSwipeArgs): Promise<InsertSwipeResult> => {
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({ swiper_dog_id: swiperDogId, target_dog_id: targetDogId, direction });
      if (swipeError) throw swipeError;

      if (direction !== 'like') return { matched: false, matchId: null };

      const dogAId = swiperDogId < targetDogId ? swiperDogId : targetDogId;
      const dogBId = swiperDogId < targetDogId ? targetDogId : swiperDogId;

      const { data, error: matchError } = await supabase
        .from('matches')
        .select('id')
        .eq('dog_a_id', dogAId)
        .eq('dog_b_id', dogBId)
        .maybeSingle();
      if (matchError) throw matchError;

      if (data) {
        const { data: targetDog } = await supabase
          .from('dogs')
          .select('owner_id, name')
          .eq('id', targetDogId)
          .maybeSingle();
        if (targetDog?.owner_id) {
          await notify({
            recipientUserId: targetDog.owner_id,
            title: "It's a match!",
            body: `You matched with ${targetDog.name}'s human`,
            data: { matchId: data.id },
          });
        }
      }

      return { matched: !!data, matchId: data?.id ?? null };
    },
  });
}
