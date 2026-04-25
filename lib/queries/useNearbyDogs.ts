import { useQuery } from '@tanstack/react-query';

import { DogRow, mapDogRowToCard } from '@/lib/demo-dogs';
import { haversineMiles, type LatLng } from '@/lib/location';
import { supabase } from '@/lib/supabase';

type RowWithLatLng = DogRow & {
  owner: { display_name: string; bio: string | null; lat: number | null; lng: number | null } | null;
};

export function useNearbyDogs(
  userId: string | undefined,
  myDogId: string | undefined,
  myLatLng?: LatLng,
  radiusMiles?: number
) {
  return useQuery({
    queryKey: ['nearby-dogs', userId, myDogId, myLatLng?.lat, myLatLng?.lng, radiusMiles],
    enabled: !!userId && !!myDogId,
    queryFn: async () => {
      if (!userId || !myDogId) return [];

      const { data: swipesData, error: swipesError } = await supabase
        .from('swipes')
        .select('target_dog_id')
        .eq('swiper_dog_id', myDogId);
      if (swipesError) throw swipesError;

      const swipedIds = (swipesData ?? []).map((s) => s.target_dog_id);

      let query = supabase
        .from('dogs')
        .select(
          'id, name, breed, birthdate, size, energy, tags, notes, primary_photo_url, photos, ai_video_url, ai_video_status, owner:owner_id(display_name, bio, lat, lng)'
        )
        .neq('owner_id', userId)
        .not('primary_photo_url', 'is', null);

      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as unknown as RowWithLatLng[];
      const dogs = rows.map((row) => {
        const dog = mapDogRowToCard(row as unknown as DogRow);
        if (myLatLng && row.owner?.lat != null && row.owner?.lng != null) {
          dog.distanceMiles =
            Math.round(haversineMiles(myLatLng, { lat: row.owner.lat, lng: row.owner.lng }) * 10) / 10;
        }
        return dog;
      });

      if (myLatLng) {
        const radius = radiusMiles ?? 50;
        return dogs.filter((d) => d.distanceMiles <= radius);
      }
      return dogs;
    },
  });
}
