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
import { colors, fonts, tracking, radii, spacing } from '@/lib/theme';

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

  const handleResend = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (otpError) {
      setError(otpError.message);
    }
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
        <View style={styles.column}>
          <View style={styles.topSpacer} />

          <View style={styles.wordmarkBlock}>
            <Text style={styles.wordmark}>DOG DATE</Text>
            <View style={styles.wordmarkUnderline} />
          </View>

          <Text style={styles.headline}>Find your dog's people.</Text>
          <Text style={styles.subline}>
            Swipe through dogs nearby. Match if it's mutual.
          </Text>

          <View style={styles.formBlock}>
            {step === 'email' ? (
              <>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMute}
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
                    <ActivityIndicator color={colors.accentInk} />
                  ) : (
                    <Text style={styles.primaryText}>Send sign-in code</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>6-DIGIT CODE</Text>
                <TextInput
                  style={styles.input}
                  value={token}
                  onChangeText={setToken}
                  placeholder="123456"
                  placeholderTextColor={colors.textMute}
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!busy}
                  textContentType="oneTimeCode"
                />
                <Pressable
                  style={styles.resendButton}
                  onPress={handleResend}
                  disabled={busy}
                >
                  <Text style={styles.resendText}>Resend code</Text>
                </Pressable>
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
                    <ActivityIndicator color={colors.accentInk} />
                  ) : (
                    <Text style={styles.primaryText}>Sign in</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>

          <View style={{ flex: 1 }} />

          <Text style={styles.legal}>
            By continuing you agree to our{' '}
            <Text style={styles.legalLink}>Terms</Text>
            {' '}and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  column: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'stretch',
  },
  topSpacer: {
    height: '30%',
  },
  wordmarkBlock: {
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.text,
    letterSpacing: tracking.loose,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  wordmarkUnderline: {
    width: 24,
    height: 1,
    backgroundColor: colors.accent,
    marginTop: 14,
    alignSelf: 'center',
  },
  headline: {
    fontFamily: fonts.displayHeavy,
    fontSize: 38,
    lineHeight: 42,
    color: colors.text,
    letterSpacing: tracking.tightDisplay,
    textAlign: 'center',
    marginTop: 64,
    maxWidth: 320,
    alignSelf: 'center',
  },
  subline: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSoft,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 320,
    alignSelf: 'center',
  },
  formBlock: {
    marginTop: 56,
  },
  fieldLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textMute,
    letterSpacing: tracking.monoLoose,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.frame,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.frame,
    marginTop: 16,
  },
  primaryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.accentInk,
    letterSpacing: tracking.body,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  resendButton: {
    paddingVertical: spacing.md,
    alignItems: 'flex-start',
  },
  resendText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSoft,
  },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.pass,
    marginTop: spacing.sm,
  },
  legal: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMute,
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  legalLink: {
    color: colors.text,
    textDecorationLine: 'underline',
  },
});
