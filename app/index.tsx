import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-store';
import { supabase } from '@/lib/supabase';

type Step = 'email' | 'code';

export default function SignInScreen() {
  const session = useAuth((s) => s.session);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session) {
    return <Redirect href="/swipe" />;
  }

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      setError('Enter a valid email');
      return;
    }
    setError(null);
    setBusy(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setEmail(trimmed);
    setStep('code');
  };

  const handleVerify = async () => {
    const cleaned = token.trim();
    if (cleaned.length < 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setError(null);
    setBusy(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: cleaned,
      type: 'email',
    });
    setBusy(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    // Auth state listener in the store will route us to /swipe automatically
    // via the <Redirect> at the top of this screen.
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.hero}>
          <Text style={styles.logo}>🐾</Text>
          <Text style={styles.title}>Dog Date</Text>
          <Text style={styles.tagline}>Playdates for pups. Friends for you.</Text>
        </View>

        <View style={styles.footer}>
          {step === 'email' ? (
            <>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#5a5a60"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                autoCorrect={false}
                editable={!busy}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  busy && styles.buttonDisabled,
                ]}
                onPress={handleSendCode}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.primaryText}>Send sign-in code</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>
                We sent a code to{' '}
                <Text style={{ color: '#fff', fontWeight: '700' }}>{email}</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={token}
                onChangeText={setToken}
                placeholder="123456"
                placeholderTextColor="#5a5a60"
                autoCapitalize="none"
                keyboardType="number-pad"
                maxLength={6}
                editable={!busy}
                textContentType="oneTimeCode"
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  busy && styles.buttonDisabled,
                ]}
                onPress={handleVerify}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.primaryText}>Sign in</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.linkButton}
                onPress={() => {
                  setStep('email');
                  setToken('');
                  setError(null);
                }}
              >
                <Text style={styles.linkText}>Use a different email</Text>
              </Pressable>
            </>
          )}

          <Text style={styles.legal}>
            By continuing you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </KeyboardAvoidingView>
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
  inputLabel: {
    color: '#9a9aa0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: -4,
  },
  input: {
    backgroundColor: '#1a1a20',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a30',
  },
  codeInput: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 6,
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  primaryText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#9a9aa0',
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '500',
  },
  legal: {
    color: '#6a6a70',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
