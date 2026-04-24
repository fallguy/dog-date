import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MatchModal } from '@/components/MatchModal';
import { SwipeDeck } from '@/components/SwipeDeck';
import { useAuth } from '@/lib/auth-store';
import { demoDogs, type Dog } from '@/lib/demo-dogs';

export default function SwipeScreen() {
  const isSignedIn = useAuth((s) => s.isSignedIn);
  const signOut = useAuth((s) => s.signOut);
  const [matchedDog, setMatchedDog] = useState<Dog | null>(null);

  if (!isSignedIn) {
    return <Redirect href="/" />;
  }

  const handleSwiped = (dog: Dog, direction: 'like' | 'pass') => {
    if (direction === 'like' && dog.isMatch) {
      setTimeout(() => setMatchedDog(dog), 250);
    }
  };

  const handleSignOut = () => {
    signOut();
    router.replace('/');
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
        yourDogName="Cooper"
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
