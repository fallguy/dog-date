import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-store';

export default function SignInScreen() {
  const isSignedIn = useAuth((s) => s.isSignedIn);
  const signIn = useAuth((s) => s.signIn);

  if (isSignedIn) {
    return <Redirect href="/swipe" />;
  }

  const handleSignIn = () => {
    signIn('Brian');
    router.replace('/swipe');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🐾</Text>
        <Text style={styles.title}>Dog Date</Text>
        <Text style={styles.tagline}>Playdates for pups. Friends for you.</Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.appleButton, pressed && styles.buttonPressed]}
          onPress={handleSignIn}
        >
          <Text style={styles.appleIcon}></Text>
          <Text style={styles.appleText}>Sign in with Apple</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={handleSignIn}
        >
          <Text style={styles.secondaryText}>Continue with phone</Text>
        </Pressable>

        <Text style={styles.legal}>
          By continuing you agree to our Terms and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logo: {
    fontSize: 80,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    color: '#9a9aa0',
    fontSize: 18,
    textAlign: 'center',
  },
  footer: {
    gap: 12,
    paddingBottom: 24,
  },
  appleButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appleIcon: {
    fontSize: 20,
    color: '#000',
    marginTop: -3,
  },
  appleText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a30',
  },
  secondaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  legal: {
    color: '#6a6a70',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
