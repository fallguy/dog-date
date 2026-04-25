import { useQuery } from '@tanstack/react-query';

import { DogRow, mapDogRowToCard } from '@/lib/demo-dogs';
import type { Dog } from '@/lib/demo-dogs';
import { supabase } from '@/lib/supabase';

export function useDog(dogId: string | undefined) {
  return useQuery({
    queryKey: ['dog', dogId],
    enabled: !!dogId,
    queryFn: async (): Promise<Dog | null> => {
      if (!dogId) return null;
      const { data, error } = await supabase
        .from('dogs')
        .select(
          'id, name, breed, birthdate, size, energy, tags, notes, primary_photo_url, photos, ai_video_url, ai_video_status, owner:owner_id(id, display_name, bio)'
        )
        .eq('id', dogId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapDogRowToCard(data as unknown as DogRow);
    },
  });
}
