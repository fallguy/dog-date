import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Dog } from '@/lib/demo-dogs';
import { colors, fonts, radii, tracking } from '@/lib/theme';

type Props = {
  dog: Dog;
};

// Off-card translation for the closed sheet. Larger than any expected sheet
// height so the sheet is fully clipped by the card's overflow:hidden when
// closed — no sliver leaks at the bottom.
const SHEET_HIDDEN_OFFSET = 360;

export function DogCard({ dog }: Props) {
  const player = useVideoPlayer(dog.videoUrl ?? null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  const cardRef = useRef<View>(null);
  const [expanded, setExpanded] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  // Animate the sheet open/closed.
  useEffect(() => {
    Animated.timing(sheetAnim, {
      toValue: expanded ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, sheetAnim]);

  // Collapse the sheet when the deck advances to a new dog.
  useEffect(() => {
    setExpanded(false);
  }, [dog.id]);

  useEffect(() => {
    if (dog.videoUrl) {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  }, [dog.videoUrl, player]);

  // expo-video web doesn't reliably autoplay on initial mount — see
  // .claude/skills/dog-date/SKILL.md gotcha 3.
  useEffect(() => {
    if (!dog.videoUrl || Platform.OS !== 'web') return;
    let cancelled = false;
    const tryPlay = () => {
      if (cancelled) return;
      const node = cardRef.current as unknown as HTMLElement | null;
      const video = node?.querySelector('video');
      if (!video) {
        requestAnimationFrame(tryPlay);
        return;
      }
      video.muted = true;
      video.setAttribute('playsinline', '');
      void video.play().catch(() => {});
    };
    tryPlay();
    return () => {
      cancelled = true;
    };
  }, [dog.videoUrl]);

  const meta = `${dog.breed} · ${dog.size} · ${dog.energy} energy`;

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HIDDEN_OFFSET, 0],
  });
  const scrimOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  return (
    <View ref={cardRef} style={styles.card}>
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
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        locations={[0.6, 1]}
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

      {/* Animated scrim that darkens the photo while the sheet is open. The
          Pressable underneath catches taps outside the sheet and closes it. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => setExpanded(false)}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: 'black', opacity: scrimOpacity },
          ]}
        />
      </Pressable>

      {/* Minimal default overlay: name, age, breed line, expand chevron. */}
      <View style={styles.contentOverlay} pointerEvents="box-none">
        <View style={styles.nameRow}>
          <Text style={styles.name}>{dog.name}</Text>
          <Text style={styles.age}>{dog.ageYears}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
            {meta}
          </Text>
          <Pressable
            onPress={() => setExpanded((e) => !e)}
            hitSlop={12}
            style={styles.chevronButton}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Hide details' : 'Show details'}
            aria-expanded={expanded}
          >
            <Text style={styles.chevronText}>{expanded ? '↓' : '↑'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Detail sheet: tags, bio, owner. Slides up from below the card. */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}
        pointerEvents={expanded ? 'auto' : 'none'}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetLabel}>About</Text>
          <Pressable
            onPress={() => setExpanded(false)}
            hitSlop={12}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close details"
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        {dog.tags.length > 0 && (
          <View style={styles.sheetTagsRow}>
            {dog.tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {dog.bio ? <Text style={styles.sheetBio}>{dog.bio}</Text> : null}

        {dog.ownerName ? (
          <View style={styles.ownerRow}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerInitial}>
                {dog.ownerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerNameText} numberOfLines={1}>
                {dog.ownerName}
              </Text>
              {dog.ownerBio ? (
                <Text style={styles.ownerBio} numberOfLines={2}>
                  {dog.ownerBio}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </Animated.View>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
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
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meta: {
    flexShrink: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSoft,
    letterSpacing: tracking.body,
    lineHeight: 18,
  },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
    lineHeight: 16,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    backgroundColor: 'rgba(10,10,10,0.96)',
    borderTopLeftRadius: radii.cardLarge,
    borderTopRightRadius: radii.cardLarge,
    gap: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textMute,
    letterSpacing: tracking.monoLoose,
    textTransform: 'uppercase',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 18,
    color: colors.textSoft,
    lineHeight: 18,
  },
  sheetTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.text,
    letterSpacing: tracking.body,
  },
  sheetBio: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  ownerAvatar: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInitial: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
    lineHeight: 16,
  },
  ownerInfo: {
    flexShrink: 1,
    gap: 2,
  },
  ownerNameText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
    letterSpacing: tracking.body,
  },
  ownerBio: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSoft,
    letterSpacing: tracking.body,
    lineHeight: 16,
  },
});
