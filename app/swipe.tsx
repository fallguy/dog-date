import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MatchModal } from '@/components/MatchModal';
import { SwipeDeck } from '@/components/SwipeDeck';
import { VideoStatusBanner } from '@/components/VideoStatusBanner';
import { useAuth } from '@/lib/auth-store';
import { demoDogs, type Dog } from '@/lib/demo-dogs';
import { useMyDog } from '@/lib/queries/useMyDog';

export default function SwipeScreen() {
  const session = useAuth((s) => s.session);
  const [matchedDog, setMatchedDog] = useState<Dog | null>(null);
  const { data: myDog, isLoading: isDogLoading } = useMyDog(session?.user.id);

  if (!session) {
    return <Redirect href="/" />;
  }
  if (isDogLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }
  if (!myDog) {
    return <Redirect href="/onboarding" />;
  }

  const handleSwiped = (dog: Dog, direction: 'like' | 'pass') => {
    if (direction === 'like' && dog.isMatch) {
      setTimeout(() => setMatchedDog(dog), 250);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Dog Date</Text>
          <Text style={styles.location}>📍 Nearby · 5 mi</Text>
        </View>
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

      <VideoStatusBanner />

      <View style={styles.deck}>
        <SwipeDeck dogs={demoDogs} onSwiped={handleSwiped} />
      </View>

      <MatchModal
        visible={!!matchedDog}
        dog={matchedDog}
        yourDogName={myDog.name}
        onClose={() => setMatchedDog(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  brand: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  location: {
    color: '#9a9aa0',
    fontSize: 13,
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  profileAvatarFallback: {
    backgroundColor: '#2a2a30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  deck: {
    flex: 1,
    padding: 16,
    paddingTop: 4,
  },
});
