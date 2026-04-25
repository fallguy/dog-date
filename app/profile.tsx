import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-store';
import { useMyDog } from '@/lib/queries/useMyDog';
import { colors, fonts, radii, tracking } from '@/lib/theme';

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

  const showAiBadge = !!(myDog?.ai_video_url && myDog?.ai_video_status === 'ready');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>You</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : myDog ? (
          <>
            <View style={styles.photoCard}>
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

              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.photoGradient}
                pointerEvents="none"
              />

              {showAiBadge && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              )}

              <View style={styles.nameOverlay}>
                <Text style={styles.dogName} numberOfLines={1}>
                  {myDog.name}
                </Text>
                <Text style={styles.dogMeta} numberOfLines={1}>
                  {`${myDog.breed} · ${myDog.size} · ${myDog.energy} energy`}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
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
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyHeading}>Add your dog</Text>
            <Text style={styles.emptySub}>Get started by uploading a photo.</Text>
            <View style={styles.actions}>
              <Text style={styles.email}>{session.user.email}</Text>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                onPress={() => router.push('/onboarding')}
              >
                <Text style={styles.primaryText}>Add your dog</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [pressed && styles.pressed]}
            onPress={async () => {
              await signOut();
            }}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [pressed && styles.pressed]}
            onPress={() =>
              Alert.alert(
                'Report / Block',
                'To report or block a user, go to your matches and tap the menu next to their name.',
                [{ text: 'OK' }],
              )
            }
          >
            <Text style={styles.reportText}>Report a problem</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
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
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.displayHeavy,
    fontSize: 22,
    letterSpacing: tracking.tightDisplay,
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    padding: 0,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  photoCard: {
    marginHorizontal: 16,
    marginTop: 8,
    aspectRatio: 3 / 4,
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
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
  photoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  aiBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: {
    color: colors.accentInk,
    fontFamily: fonts.monoBold,
    fontSize: 9,
    letterSpacing: tracking.mono,
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  dogName: {
    color: colors.text,
    fontFamily: fonts.displayHeavy,
    fontSize: 36,
    letterSpacing: tracking.tightDisplay,
  },
  dogMeta: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 4,
    letterSpacing: tracking.body,
  },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },
  email: {
    color: colors.textMute,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: tracking.mono,
    marginBottom: 4,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.frame,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: colors.accentInk,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.frame,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  secondaryText: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  emptyHeading: {
    color: colors.text,
    fontFamily: fonts.displayHeavy,
    fontSize: 28,
    letterSpacing: tracking.tightDisplay,
  },
  emptySub: {
    color: colors.textSoft,
    fontFamily: fonts.body,
    fontSize: 15,
    marginTop: 6,
  },
  footer: {
    marginTop: 32,
    gap: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: colors.pass,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  reportText: {
    color: colors.textMute,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.75,
  },
});
