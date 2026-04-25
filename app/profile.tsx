import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-store';
import { useMyDog } from '@/lib/queries/useMyDog';

export default function ProfileScreen() {
  const session = useAuth((s) => s.session);
  const signOut = useAuth((s) => s.signOut);
  const { data: myDog, isLoading } = useMyDog(session?.user.id);

  // Hook must run unconditionally — pass null when there's no video yet.
  // The init callback only fires on first player creation, so when the URL
  // arrives later (query resolves after mount) we need an effect to play.
  const videoUrl = myDog?.ai_video_url ?? null;
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (videoUrl) {
      player.play();
    }
  }, [videoUrl, player]);

  if (!session) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : myDog ? (
          <>
            <View style={styles.photoFrame}>
              {myDog.primary_photo_url && (
                <Image
                  source={{ uri: myDog.primary_photo_url }}
                  style={styles.photoFill}
                  contentFit="cover"
                  transition={200}
                />
              )}
              {videoUrl && (
                <VideoView
                  style={styles.photoFill}
                  player={player}
                  contentFit="cover"
                  allowsFullscreen={false}
                  nativeControls={false}
                />
              )}
              {videoUrl && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>✨ AI</Text>
                </View>
              )}
            </View>
            <Text style={styles.dogName}>{myDog.name}</Text>
            <Text style={styles.dogMeta}>
              {myDog.breed} · {myDog.size} · {myDog.energy} energy
            </Text>
            <Text style={styles.email}>{session.user.email}</Text>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={() => router.push('/onboarding')}
            >
              <Text style={styles.primaryText}>Edit dog</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              onPress={() => router.push('/generate-video')}
            >
              <Text style={styles.secondaryText}>Regenerate AI video</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.dogName}>No dog yet</Text>
            <Text style={styles.email}>{session.user.email}</Text>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={() => router.push('/onboarding')}
            >
              <Text style={styles.primaryText}>Add your dog</Text>
            </Pressable>
          </>
        )}

        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
          onPress={async () => {
            await signOut();
          }}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
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
  back: {
    color: '#9a9aa0',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  photoFrame: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 18,
    backgroundColor: '#1a1a20',
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
  aiBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dogName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  dogMeta: {
    color: '#9a9aa0',
    fontSize: 15,
  },
  email: {
    color: '#5a5a60',
    fontSize: 13,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1a1a20',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a30',
  },
  secondaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  signOutText: {
    color: '#f87171',
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
});
