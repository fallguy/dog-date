import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Dog } from '@/lib/demo-dogs';
import { colors, fonts, radii, tracking } from '@/lib/theme';

type Props = {
  dog: Dog;
};

export function DogCard({ dog }: Props) {
  // The `useVideoPlayer` init callback fires only on first creation; when the
  // deck advances and `dog.videoUrl` changes, we need to re-call play()
  // ourselves so the new dog's video loops instead of sitting on a paused
  // first frame (looks identical to the static photo to the user).
  const player = useVideoPlayer(dog.videoUrl ?? null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (dog.videoUrl) {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  }, [dog.videoUrl, player]);

  const meta = `${dog.breed} · ${dog.size} · ${dog.energy} energy`;

  return (
    <View style={styles.card}>
      {/* Media wrapped in pointer-events:none Views so drag/click events
          reach the SwipeDeck's gesture detector instead of being captured by
          the underlying <img>/<video> DOM elements (which default to
          pointer-events:auto on web and otherwise swallow mouse drags). */}
      <View style={styles.fill} pointerEvents="none">
        <Image
          source={{ uri: dog.photo }}
          style={styles.fill}
          contentFit="cover"
          transition={200}
        />
      </View>

      {dog.videoUrl && (
        <View style={styles.fill} pointerEvents="none">
          <VideoView
            style={styles.video}
            player={player}
            contentFit="cover"
            allowsFullscreen={false}
            nativeControls={false}
          />
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        locations={[0.5, 1]}
        style={styles.fill}
        pointerEvents="none"
      />

      {dog.videoUrl && (
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      )}

      {dog.distanceMiles > 0 && (
        <View style={styles.distancePill}>
          <Text style={styles.distanceText}>{`${dog.distanceMiles}mi`}</Text>
        </View>
      )}

      <View style={styles.contentOverlay} pointerEvents="none">
        <View style={styles.nameRow}>
          <Text style={styles.name}>{dog.name}</Text>
          <Text style={styles.age}>{dog.ageYears}</Text>
        </View>

        <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
          {meta}
        </Text>

        <Text style={styles.bio} numberOfLines={2}>
          {dog.bio}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  // The native <video> element on web ignores inset:0 alone for sizing;
  // explicit width/height force it to match the parent card box so the
  // 9:16 AI video doesn't render at intrinsic 720×1280 and overflow.
  video: {
    ...StyleSheet.absoluteFillObject,
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
    fontFamily: fonts.monoBold,
    fontSize: 9,
    letterSpacing: tracking.mono,
    color: colors.accentInk,
    textTransform: 'uppercase',
  },
  distancePill: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  distanceText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.text,
    letterSpacing: tracking.mono,
  },
  contentOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    paddingBottom: 28,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  name: {
    fontFamily: fonts.displayHeavy,
    fontSize: 36,
    lineHeight: 38,
    color: colors.text,
    letterSpacing: tracking.tightDisplay,
  },
  age: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.textSoft,
    letterSpacing: tracking.mono,
    alignSelf: 'baseline',
  },
  meta: {
    marginTop: 4,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSoft,
    letterSpacing: tracking.body,
    lineHeight: 18,
  },
  bio: {
    marginTop: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSoft,
    lineHeight: 19,
  },
});
