import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

type DogInMatch = {
  id: string;
  name: string;
  owner_id: string;
  primary_photo_url: string | null;
  owner: { id: string; display_name: string } | null;
};

export type MatchWithDogs = {
  id: string;
  created_at: string;
  dog_a_id: string;
  dog_b_id: string;
  dog_a: DogInMatch | null;
  dog_b: DogInMatch | null;
};

export function useMatches(myDogId: string | undefined) {
  return useQuery({
    queryKey: ['matches', myDogId],
    enabled: !!myDogId,
    queryFn: async (): Promise<MatchWithDogs[]> => {
      if (!myDogId) return [];
      const { data, error } = await supabase
        .from('matches')
        .select(
          'id, created_at, dog_a_id, dog_b_id, dog_a:dog_a_id(id, name, owner_id, primary_photo_url, owner:owner_id(id, display_name)), dog_b:dog_b_id(id, name, owner_id, primary_photo_url, owner:owner_id(id, display_name))'
        )
        .or('dog_a_id.eq.' + myDogId + ',dog_b_id.eq.' + myDogId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MatchWithDogs[];
    },
  });
}
