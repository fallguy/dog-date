import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-store';
import { useDog } from '@/lib/queries/useDog';
import { colors, fonts, tracking, radii } from '@/lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_HEIGHT = (SCREEN_WIDTH * 4) / 3;

export default function DogProfileScreen() {
  const { dogId } = useLocalSearchParams<{ dogId: string }>();
  const session = useAuth((s) => s.session);
  const { data: dog, isLoading } = useDog(dogId);
  const [activeIndex, setActiveIndex] = useState(0);
  const photoListRef = useRef<FlatList<string>>(null);

  const videoUrl = dog?.videoUrl ?? null;
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (videoUrl) player.play();
  }, [videoUrl, player]);

  if (!session) {
    return <Redirect href="/" />;
  }

  const meta = dog
    ? [
        typeof dog.ageYears === 'number' ? `${dog.ageYears}y` : null,
        dog.breed,
        dog.size,
        dog.energy,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  const photos = dog?.photos ?? [];
  const showCarousel = !videoUrl && photos.length > 1;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/matches'))}
          hitSlop={12}
        >
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : !dog ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Dog not found</Text>
          </View>
        ) : (
          <>
            <View style={styles.photoCard}>
              {showCarousel ? (
                <>
                  <FlatList
                    ref={photoListRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    data={photos}
                    keyExtractor={(uri, i) => `${i}-${uri}`}
                    onScroll={handleScroll}
                    scrollEventThrottle={32}
                    renderItem={({ item }) => (
                      <Image
                        source={{ uri: item }}
                        style={styles.carouselPhoto}
                        contentFit="cover"
                        transition={150}
                      />
                    )}
                  />
                  <View style={styles.dotsRow} pointerEvents="none">
                    {photos.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i === activeIndex && styles.dotActive,
                        ]}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <>
                  {dog.photo ? (
                    <Image
                      source={{ uri: dog.photo }}
                      style={styles.photoFill}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : null}
                  {videoUrl ? (
                    <VideoView
                      style={styles.photoFill}
                      player={player}
                      contentFit="cover"
                      allowsFullscreen={false}
                      nativeControls={false}
                    />
                  ) : null}
                </>
              )}

              {videoUrl ? (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              ) : null}

              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
                style={styles.bottomGradient}
                pointerEvents="none"
              />

              <View style={styles.nameOverlay} pointerEvents="none">
                <Text style={styles.dogName} numberOfLines={2}>
                  {dog.name}
                </Text>
                {meta ? (
                  <Text style={styles.dogMeta} numberOfLines={2}>
                    {meta}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.body}>
              {dog.bio ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>About</Text>
                  <Text style={styles.bio}>{dog.bio}</Text>
                </View>
              ) : null}

              {dog.tags.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Tags</Text>
                  <View style={styles.tagRow}>
                    {dog.tags.map((tag) => (
                      <View key={tag} style={styles.tagChip}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {dog.ownerName ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Owner</Text>
                  <View style={styles.ownerRow}>
                    <View style={styles.ownerAvatar}>
                      <Text style={styles.ownerInitial}>
                        {dog.ownerName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.ownerInfo}>
                      <Text style={styles.ownerName}>{dog.ownerName}</Text>
                      {dog.ownerBio ? (
                        <Text style={styles.ownerBio} numberOfLines={2}>
                          {dog.ownerBio}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  back: {
    color: colors.textSoft,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
  headerSpacer: {
    width: 60,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: colors.textSoft,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  photoCard: {
    width: '100%',
    height: PHOTO_HEIGHT,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  photoFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  carouselPhoto: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  dotsRow: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.text,
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
    textTransform: 'uppercase',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  dogName: {
    color: colors.text,
    fontSize: 38,
    lineHeight: 42,
    fontFamily: fonts.displayHeavy,
    letterSpacing: tracking.tightDisplay,
  },
  dogMeta: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.body,
    letterSpacing: tracking.body,
    marginTop: 6,
    lineHeight: 20,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: colors.textMute,
    fontSize: 11,
    fontFamily: fonts.mono,
    letterSpacing: tracking.monoLoose,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bio: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.body,
    lineHeight: 24,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInitial: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  ownerInfo: {
    flex: 1,
    gap: 2,
  },
  ownerName: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  ownerBio: {
    color: colors.textSoft,
    fontSize: 13,
    fontFamily: fonts.body,
  },
});
