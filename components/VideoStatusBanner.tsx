import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { VideoPreviewModal } from '@/components/VideoPreviewModal';
import { useAuth } from '@/lib/auth-store';
import { useLatestPendingJob } from '@/lib/hooks/useVideoPoller';
import { useNotifications } from '@/lib/notifications-store';
import { useMyDog } from '@/lib/queries/useMyDog';

type BannerVariant = 'generating' | 'ready' | 'failed';

export function VideoStatusBanner() {
  const session = useAuth((s) => s.session);
  const { data: dog } = useMyDog(session?.user.id);
  const lastSeenVideoUrl = useNotifications((s) => s.lastSeenVideoUrl);
  const markSeen = useNotifications((s) => s.markSeen);
  const [previewOpen, setPreviewOpen] = useState(false);

  const isPending = dog?.ai_video_status === 'pending';
  const { data: pendingJob } = useLatestPendingJob(dog?.id, isPending);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Tick elapsed time once per second while we have a pending job.
  useEffect(() => {
    if (!isPending || !pendingJob?.started_at) {
      setElapsedSec(0);
      return;
    }
    const startMs = new Date(pendingJob.started_at).getTime();
    const tick = () => setElapsedSec(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isPending, pendingJob?.started_at]);

  if (!dog) return null;

  let variant: BannerVariant | null = null;
  if (dog.ai_video_status === 'pending') variant = 'generating';
  else if (
    dog.ai_video_status === 'ready' &&
    dog.ai_video_url &&
    dog.ai_video_url !== lastSeenVideoUrl
  )
    variant = 'ready';
  else if (dog.ai_video_status === 'failed') variant = 'failed';

  if (!variant) return null;

  const handleTap = () => {
    if (variant === 'ready' && dog.ai_video_url) {
      setPreviewOpen(true);
    } else if (variant === 'failed') {
      router.push('/generate-video');
    }
  };

  const handleDismiss = () => {
    if (variant === 'ready' && dog.ai_video_url) {
      markSeen(dog.ai_video_url);
    }
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    if (dog.ai_video_url) markSeen(dog.ai_video_url);
  };

  const elapsedLabel = `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, '0')}`;

  return (
    <>
      <Pressable
        onPress={handleTap}
        disabled={variant === 'generating'}
        style={({ pressed }) => [
          styles.banner,
          variant === 'generating' && styles.bannerGenerating,
          variant === 'ready' && styles.bannerReady,
          variant === 'failed' && styles.bannerFailed,
          pressed && variant !== 'generating' && { opacity: 0.85 },
        ]}
      >
        <Text style={styles.icon}>
          {variant === 'generating' ? '✨' : variant === 'ready' ? '✨' : '⚠️'}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {variant === 'generating'
              ? `Generating ${dog.name}'s video…`
              : variant === 'ready'
                ? `${dog.name}'s video is ready!`
                : `Couldn't make ${dog.name}'s video`}
          </Text>
          <Text style={styles.subtitle}>
            {variant === 'generating'
              ? `${elapsedLabel} — keep swiping, we'll let you know when it's done`
              : variant === 'ready'
                ? 'Tap to preview'
                : 'Tap to try a different prompt'}
          </Text>
        </View>
        {variant === 'ready' && (
          <Pressable
            onPress={handleDismiss}
            hitSlop={12}
            style={({ pressed }) => [styles.dismiss, pressed && { opacity: 0.55 }]}
          >
            <Text style={styles.dismissText}>✕</Text>
          </Pressable>
        )}
      </Pressable>

      <VideoPreviewModal
        visible={previewOpen}
        videoUrl={dog.ai_video_url}
        dogName={dog.name}
        onClose={handlePreviewClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  bannerGenerating: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bannerReady: {
    backgroundColor: 'rgba(74, 222, 128, 0.16)', // green-400 @ 16%
    borderColor: 'rgba(74, 222, 128, 0.55)',
  },
  bannerFailed: {
    backgroundColor: 'rgba(248, 113, 113, 0.14)', // red-400 @ 14%
    borderColor: 'rgba(248, 113, 113, 0.55)',
  },
  icon: {
    fontSize: 22,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  dismiss: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
