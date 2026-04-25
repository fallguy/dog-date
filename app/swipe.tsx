import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MatchModal } from '@/components/MatchModal';
import { SwipeDeck } from '@/components/SwipeDeck';
import { useAuth } from '@/lib/auth-store';
import { demoDogs, type Dog } from '@/lib/demo-dogs';
import { useMyDog } from '@/lib/queries/useMyDog';

export default function SwipeScreen() {
  const session = useAuth((s) => s.session);
  const signOut = useAuth((s) => s.signOut);
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

  const handleSignOut = async () => {
    await signOut();
    // Auth listener clears session; <Redirect> at the top sends us to /.
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Dog Date</Text>
          <Text style={styles.location}>📍 Nearby · 5 mi</Text>
        </View>
        <Pressable onPress={handleSignOut} hitSlop={12}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>

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
  signOut: {
    color: '#9a9aa0',
    fontSize: 14,
    fontWeight: '600',
  },
  deck: {
    flex: 1,
    padding: 16,
    paddingTop: 4,
  },
});
