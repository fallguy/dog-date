import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { VideoPreviewModal } from '@/components/VideoPreviewModal';
import { useAuth } from '@/lib/auth-store';
import { useLatestPendingJob } from '@/lib/hooks/useVideoPoller';
import { useNotifications } from '@/lib/notifications-store';
import { useMyDog } from '@/lib/queries/useMyDog';
import { colors, fonts, radii, tracking } from '@/lib/theme';

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
        {variant === 'generating' && (
          <>
            <Text style={styles.bodyText} numberOfLines={1}>
              {`${dog.name} is becoming a star…`}
            </Text>
            <Text style={styles.counter}>{elapsedLabel}</Text>
          </>
        )}

        {variant === 'ready' && (
          <>
            <Text style={[styles.bodyText, { flex: 1 }]} numberOfLines={1}>
              {`${dog.name}'s video is ready.`}
            </Text>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setPreviewOpen(true);
              }}
              hitSlop={8}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.previewLink}>Preview →</Text>
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              hitSlop={12}
              style={({ pressed }) => [styles.dismiss, pressed && { opacity: 0.55 }]}
            >
              <Text style={styles.dismissText}>×</Text>
            </Pressable>
          </>
        )}

        {variant === 'failed' && (
          <>
            <Text style={[styles.bodyText, { flex: 1 }]} numberOfLines={1}>
              {`${dog.name}'s video didn't generate.`}
            </Text>
            <Text style={styles.retryLink}>Retry</Text>
          </>
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
    borderRadius: radii.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  bannerGenerating: {
    backgroundColor: colors.surface,
    borderColor: colors.divider,
  },
  bannerReady: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
  },
  bannerFailed: {
    backgroundColor: colors.surface,
    borderColor: colors.pass,
  },
  bodyText: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    flex: 1,
  },
  counter: {
    color: colors.textSoft,
    fontFamily: fonts.mono,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    letterSpacing: tracking.mono,
  },
  previewLink: {
    color: colors.accent,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  retryLink: {
    color: colors.pass,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  dismiss: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: colors.textMute,
    fontFamily: fonts.bodyMedium,
    fontSize: 18,
    lineHeight: 18,
  },
});
