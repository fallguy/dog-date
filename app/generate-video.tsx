import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
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

type Phase = 'compose' | 'generating' | 'ready' | 'failed';

const POLL_INTERVAL_MS = 5_000;

export default function GenerateVideoScreen() {
  const session = useAuth((s) => s.session);
  const { data: dog, isLoading: isDogLoading, refetch } = useMyDog(
    session?.user.id
  );

  const [prompt, setPrompt] = useState('');
  const [scenario, setScenario] = useState<string>('custom');
  const [phase, setPhase] = useState<Phase>('compose');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const jobIdRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, []);

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

  // If we already have a video on the dog (e.g., re-entering this screen)
  if (dog.ai_video_status === 'ready' && dog.ai_video_url && phase === 'compose') {
    setVideoUrl(dog.ai_video_url);
    setPhase('ready');
  }

  const handleSurpriseMe = () => {
    const picked = pickScenario(dog.id);
    const filled = picked.promptTemplate(dog.breed);
    setPrompt(filled);
    setScenario(picked.id);
  };

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (trimmed.length < 5) {
      setError('Add a few more words to the prompt');
      return;
    }
    setError(null);
    setPhase('generating');
    setElapsed(0);

    elapsedTimerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);

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
      jobIdRef.current = data.video_job_id;
      schedulePoll();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setPhase('failed');
      stopTimers();
    }
  };

  const schedulePoll = () => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = setTimeout(pollOnce, POLL_INTERVAL_MS);
  };

  const pollOnce = async () => {
    const jobId = jobIdRef.current;
    if (!jobId) return;
    try {
      const { data, error: pollError } = await supabase.functions.invoke<{
        status: 'pending' | 'ready' | 'failed';
        video_url?: string;
        error?: string;
      }>('fal-poll', {
        body: { video_job_id: jobId },
      });
      if (pollError) throw pollError;
      if (!data) throw new Error('Empty poll response');

      if (data.status === 'ready' && data.video_url) {
        stopTimers();
        setVideoUrl(data.video_url);
        setPhase('ready');
        refetch();
        return;
      }
      if (data.status === 'failed') {
        stopTimers();
        setError(data.error ?? 'Generation failed');
        setPhase('failed');
        return;
      }
      // Still pending — schedule next poll
      schedulePoll();
    } catch (e) {
      // Network blip — back off and retry once
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Polling: ${msg}. Retrying...`);
      schedulePoll();
    }
  };

  const stopTimers = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  };

  const handleRetry = () => {
    setError(null);
    setPhase('compose');
    jobIdRef.current = null;
  };

  const handleStartSwiping = () => {
    router.replace('/swipe');
  };

  const elapsedLabel = `${Math.floor(elapsed / 60)
    .toString()
    .padStart(1, '0')}:${(elapsed % 60).toString().padStart(2, '0')}`;

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
            We&apos;ll turn {dog.name}&apos;s photo into a short, looping video using AI.
            Describe what you want them doing — the funnier, the better.
          </Text>

          <View style={styles.previewSlot}>
            {phase === 'ready' && videoUrl ? (
              <VideoView
                style={styles.preview}
                player={player}
                contentFit="cover"
                allowsFullscreen={false}
                nativeControls={false}
              />
            ) : dog.primary_photo_url ? (
              <>
                <Image
                  source={{ uri: dog.primary_photo_url }}
                  style={styles.preview}
                  contentFit="cover"
                />
                {phase === 'generating' && (
                  <View style={styles.progressOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.progressText}>Generating…</Text>
                    <Text style={styles.elapsedText}>{elapsedLabel}</Text>
                    <Text style={styles.progressHint}>
                      Veo 3.1 Lite usually takes 1–2 minutes.
                    </Text>
                  </View>
                )}
              </>
            ) : null}
          </View>

          {phase === 'compose' && (
            <>
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
                editable={phase === 'compose'}
              />
              <Pressable style={styles.surpriseButton} onPress={handleSurpriseMe}>
                <Text style={styles.surpriseText}>🎲 Surprise me</Text>
              </Pressable>

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleGenerate}
              >
                <Text style={styles.primaryText}>Generate video (~$0.30)</Text>
              </Pressable>

              <Pressable style={styles.linkButton} onPress={handleStartSwiping}>
                <Text style={styles.linkText}>Skip for now</Text>
              </Pressable>
            </>
          )}

          {phase === 'generating' && (
            <Text style={styles.hintCenter}>
              Hang tight — we&apos;ll show the video as soon as it&apos;s ready.
            </Text>
          )}

          {phase === 'ready' && (
            <>
              <Text style={styles.successText}>Looking good! ✨</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleStartSwiping}
              >
                <Text style={styles.primaryText}>Start swiping</Text>
              </Pressable>
              <Pressable style={styles.linkButton} onPress={handleRetry}>
                <Text style={styles.linkText}>Generate another version</Text>
              </Pressable>
            </>
          )}

          {phase === 'failed' && (
            <>
              <Text style={styles.error}>{error ?? 'Something went wrong.'}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleRetry}
              >
                <Text style={styles.primaryText}>Try again</Text>
              </Pressable>
              <Pressable style={styles.linkButton} onPress={handleStartSwiping}>
                <Text style={styles.linkText}>Skip for now</Text>
              </Pressable>
            </>
          )}
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
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  progressText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  elapsedText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  progressHint: {
    color: '#bfbfc8',
    fontSize: 13,
    paddingHorizontal: 32,
    textAlign: 'center',
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
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#9a9aa0',
    fontSize: 15,
    fontWeight: '600',
  },
  successText: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  hintCenter: {
    color: '#9a9aa0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  error: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '500',
  },
});
