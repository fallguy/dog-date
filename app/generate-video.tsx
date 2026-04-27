import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-store';
import { useMyDog } from '@/lib/queries/useMyDog';
import { supabase } from '@/lib/supabase';
import { pickScenario } from '@/lib/video-scenarios';

export default function GenerateVideoScreen() {
  const session = useAuth((s) => s.session);
  const queryClient = useQueryClient();
  const { data: dog, isLoading: isDogLoading } = useMyDog(session?.user.id);

  const [prompt, setPrompt] = useState('');
  const [scenario, setScenario] = useState<string>('custom');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return <Redirect href="/" />;
  if (isDogLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }
  if (!dog) return <Redirect href="/onboarding" />;

  const handleSurpriseMe = () => {
    const picked = pickScenario(dog.id);
    setPrompt(picked.prompt);
    setScenario(picked.id);
  };

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (trimmed.length < 5) {
      setError('Add a few more words to the prompt');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<{
        video_job_id: string;
        fal_request_id: string;
        error?: string;
      }>('generate-dog-video', {
        body: {
          dog_id: dog.id,
          prompt: trimmed,
          scenario,
        },
      });
      if (invokeError) throw invokeError;
      if (!data?.video_job_id) {
        throw new Error(data?.error ?? 'No job id returned');
      }
      // Refresh dog row so the global poller (mounted in _layout) sees
      // ai_video_status='pending' and starts checking fal-poll.
      await queryClient.invalidateQueries({
        queryKey: ['my-dog', session.user.id],
      });
      router.replace('/swipe');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setBusy(false);
    }
  };

  const handleSkip = () => {
    router.replace('/swipe');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            Make {dog.name}&apos;s signature video ✨
          </Text>
          <Text style={styles.subtitle}>
            We&apos;ll turn {dog.name}&apos;s photo into a short, looping video.
            Describe what you want them doing — the funnier, the better. You can
            keep swiping while we work on it.
          </Text>

          <View style={styles.previewSlot}>
            {dog.primary_photo_url && (
              <Image
                source={{ uri: dog.primary_photo_url }}
                style={styles.preview}
                contentFit="cover"
              />
            )}
          </View>

          <Text style={styles.fieldLabel}>Prompt</Text>
          <TextInput
            style={styles.input}
            value={prompt}
            onChangeText={setPrompt}
            placeholder={`A ${dog.breed} dog flying a tiny airplane through fluffy clouds, cinematic, 5 seconds`}
            placeholderTextColor="#5a5a60"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!busy}
          />
          <Pressable
            style={styles.surpriseButton}
            onPress={handleSurpriseMe}
            disabled={busy}
          >
            <Text style={styles.surpriseText}>🎲 Surprise me</Text>
          </Pressable>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              busy && styles.buttonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.primaryText}>Generate video (~$0.30)</Text>
            )}
          </Pressable>

          <Pressable style={styles.linkButton} onPress={handleSkip} disabled={busy}>
            <Text style={styles.linkText}>Skip — start swiping</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0F',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  subtitle: {
    color: '#9a9aa0',
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 4,
  },
  previewSlot: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#1a1a20',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2a2a30',
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  fieldLabel: {
    color: '#9a9aa0',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#1a1a20',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 21,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a30',
    minHeight: 110,
  },
  surpriseButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1a1a20',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2a2a30',
  },
  surpriseText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
});
