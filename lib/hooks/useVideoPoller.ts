import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth-store';
import { useMyDog } from '@/lib/queries/useMyDog';
import { supabase } from '@/lib/supabase';

const POLL_INTERVAL_MS = 5_000;

/**
 * Latest pending video_jobs row for this dog (id + started_at).
 * Used by both the poller and the banner (for elapsed-time display).
 */
export function useLatestPendingJob(dogId: string | undefined, isPending: boolean) {
  return useQuery({
    queryKey: ['latest-pending-job', dogId],
    enabled: isPending && !!dogId,
    queryFn: async () => {
      if (!dogId) return null;
      const { data, error } = await supabase
        .from('video_jobs')
        .select('id, started_at')
        .eq('dog_id', dogId)
        .eq('status', 'pending')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Global polling hook — mount once in the authenticated subtree of the
 * root layout. While the user's dog has ai_video_status='pending', this
 * calls the fal-poll edge function every 5s. When the status flips to
 * ready/failed, fal-poll updates the DB rows; this hook then invalidates
 * the my-dog query so the banner picks up the new state.
 */
export function useVideoPoller() {
  const session = useAuth((s) => s.session);
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const { data: dog } = useMyDog(userId);
  const isPending = dog?.ai_video_status === 'pending';
  const dogId = dog?.id;

  const { data: pendingJob } = useLatestPendingJob(dogId, isPending);
  const jobId = pendingJob?.id;

  useQuery({
    queryKey: ['fal-poll', jobId],
    enabled: !!jobId && isPending,
    refetchInterval: isPending ? POLL_INTERVAL_MS : false,
    // Don't cache the poll response across renders aggressively; we rely
    // on side-effects (DB updates by the edge function) to make progress.
    staleTime: 0,
    queryFn: async () => {
      if (!jobId) return null;
      const { data, error } = await supabase.functions.invoke<{
        status: 'pending' | 'ready' | 'failed';
        video_url?: string | null;
        error?: string;
      }>('fal-poll', {
        body: { video_job_id: jobId },
      });
      if (error) throw error;

      // If the job has resolved, propagate by invalidating the dog query.
      if (data?.status && data.status !== 'pending') {
        await queryClient.invalidateQueries({ queryKey: ['my-dog', userId] });
        await queryClient.invalidateQueries({
          queryKey: ['latest-pending-job', dogId],
        });
      }
      return data ?? null;
    },
  });
}
