import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MatchModal } from '@/components/MatchModal';
import { SwipeDeck } from '@/components/SwipeDeck';
import { VideoStatusBanner } from '@/components/VideoStatusBanner';
import { useAuth } from '@/lib/auth-store';
import type { Dog } from '@/lib/demo-dogs';
import { requestLocation, type LatLng } from '@/lib/location';
import { useMyDog } from '@/lib/queries/useMyDog';
import { useNearbyDogs } from '@/lib/queries/useNearbyDogs';
import { useInsertSwipe } from '@/lib/queries/useInsertSwipe';
import { useMatches } from '@/lib/queries/useMatches';
import { colors, fonts, tracking, radii } from '@/lib/theme';

export default function SwipeScreen() {
  const session = useAuth((s) => s.session);
  const [matchedDog, setMatchedDog] = useState<Dog | null>(null);
  const [matchedMatchId, setMatchedMatchId] = useState<string | null>(null);
  const insertSwipe = useInsertSwipe();
  const [myLatLng, setMyLatLng] = useState<LatLng | undefined>(undefined);
  useEffect(() => {
    requestLocation().then((loc) => {
      if (loc) setMyLatLng(loc);
    });
  }, []);
  const { data: myDog, isLoading: isDogLoading } = useMyDog(session?.user.id);
  const { data: nearbyDogs = [], isLoading: isDogsLoading } = useNearbyDogs(
    session?.user.id,
    myDog?.id,
    myLatLng
  );
  const { data: matches = [] } = useMatches(myDog?.id);
  const hasMatches = matches.length > 0;

  if (!session) {
    return <Redirect href="/" />;
  }
  if (isDogLoading || (isDogsLoading && nearbyDogs.length === 0)) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }
  if (!myDog) {
    return <Redirect href="/onboarding" />;
  }

  const handleSwiped = async (dog: Dog, direction: 'like' | 'pass') => {
    try {
      const result = await insertSwipe.mutateAsync({
        swiperDogId: myDog.id,
        targetDogId: dog.id,
        direction,
      });
      if (result.matched) {
        setTimeout(() => {
          setMatchedDog(dog);
          setMatchedMatchId(result.matchId);
        }, 250);
      }
    } catch (err) {
      Alert.alert('Swipe failed', String(err));
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>DOG DATE</Text>
          <Text style={styles.nearby}>{`${nearbyDogs.length} nearby`}</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => router.push('/matches')}
            hitSlop={12}
            style={({ pressed }) => [styles.matchesButton, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.matchesButtonText}>Matches</Text>
            {hasMatches ? (
              <Text style={styles.matchesCount}>· {matches.length}</Text>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => router.push('/profile')}
            hitSlop={12}
            style={({ pressed }) => [styles.profileButton, pressed && { opacity: 0.6 }]}
            accessibilityLabel="Your profile"
          >
            {myDog.primary_photo_url ? (
              <Image
                source={{ uri: myDog.primary_photo_url }}
                style={styles.profileAvatar}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View style={[styles.profileAvatar, styles.profileAvatarFallback]}>
                <Text style={styles.profileInitial}>
                  {myDog.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <VideoStatusBanner />

      <View style={styles.deck}>
        <SwipeDeck dogs={nearbyDogs} onSwiped={handleSwiped} />
      </View>

      <MatchModal
        visible={!!matchedDog}
        dog={matchedDog}
        yourDogName={myDog.name}
        onClose={() => {
          setMatchedDog(null);
          setMatchedMatchId(null);
        }}
        onSayHi={
          matchedMatchId
            ? () => {
                const id = matchedMatchId;
                setMatchedDog(null);
                setMatchedMatchId(null);
                router.push('/chat/' + id);
              }
            : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  brandBlock: {
    flex: 1,
  },
  brand: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    letterSpacing: tracking.loose,
    textTransform: 'uppercase',
  },
  nearby: {
    color: colors.textMute,
    fontSize: 11,
    fontFamily: fonts.mono,
    letterSpacing: tracking.mono,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  matchesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchesButtonText: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  matchesCount: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: tracking.mono,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  profileAvatarFallback: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  deck: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
});
