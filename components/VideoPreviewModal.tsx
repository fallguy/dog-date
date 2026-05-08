import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radii, tracking } from '@/lib/theme';

type Props = {
  visible: boolean;
  videoUrl: string | null;
  dogName: string;
  scenario?: string | null;
  onClose: () => void;
};

export function VideoPreviewModal({ visible, videoUrl, dogName, scenario, onClose }: Props) {
  // The init callback only runs once on player creation — so we set flags
  // here and kick playback from a separate effect that re-fires on open.
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (visible && videoUrl) {
      player.play();
    } else {
      player.pause();
    }
  }, [visible, videoUrl, player]);

  if (!videoUrl) return null;

  const caption = scenario ? `${dogName} as ${scenario}.` : 'Your video is ready.';

  const handleTryAgain = () => {
    onClose();
    router.push('/generate-video');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.backdrop} edges={['top', 'bottom']}>
        <View style={styles.card}>
          <View style={styles.videoWrap}>
            <VideoView
              style={styles.video}
              player={player}
              contentFit="contain"
              allowsFullscreen={false}
              nativeControls={false}
            />

            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.close, pressed && { opacity: 0.55 }]}
              accessibilityRole="button"
              accessibilityLabel="Close preview"
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>Your AI video</Text>
            <Text style={styles.caption}>{caption}</Text>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.75 }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.primaryText}>Done</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryLink, pressed && { opacity: 0.6 }]}
              onPress={handleTryAgain}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <Text style={styles.secondaryLinkText}>Try again</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 380,
  },
  // Fills available vertical space; the video uses contentFit="contain" so
  // the full 9:16 frame is preserved (letterboxes on wide viewports, fills
  // the box on phone-shaped ones). No hard aspect ratio means the body block
  // below is always visible regardless of viewport height.
  videoWrap: {
    flex: 1,
    backgroundColor: colors.bg,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  aiBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: {
    color: colors.accentInk,
    fontFamily: fonts.monoBold,
    fontSize: 9,
    letterSpacing: tracking.mono,
  },
  close: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    lineHeight: 18,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.displayHeavy,
    fontSize: 24,
    letterSpacing: tracking.tightDisplay,
  },
  caption: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.frame,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryText: {
    color: colors.accentInk,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  secondaryLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
});
