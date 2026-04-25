import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { Alert, ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-store';
import { useMyDog } from '@/lib/queries/useMyDog';
import { useMatches, type MatchWithDogs } from '@/lib/queries/useMatches';
import { useBlock } from '@/lib/queries/useBlock';
import { useSendReport } from '@/lib/queries/useSendReport';
import { colors, fonts, tracking, radii } from '@/lib/theme';

export default function MatchesScreen() {
  const session = useAuth((s) => s.session);
  const { data: myDog } = useMyDog(session?.user.id);
  const { data: matches = [], isLoading } = useMatches(myDog?.id);
  const { mutate: block } = useBlock();
  const { mutate: report } = useSendReport();

  if (!session) {
    return <Redirect href="/" />;
  }

  const renderItem = ({ item: match }: { item: MatchWithDogs }) => {
    const otherDog = match.dog_a_id === myDog?.id ? match.dog_b : match.dog_a;
    if (!otherDog) return null;
    const otherOwnerId = otherDog.owner?.id ?? otherDog.owner_id;

    const handleMore = () => {
      Alert.alert(otherDog.name, undefined, [
        {
          text: 'Report',
          onPress: () =>
            report(
              { reporterId: session.user.id, targetId: otherOwnerId, reason: 'inappropriate' },
              {
                onSuccess: () => Alert.alert('Reported', "Thanks, we'll review."),
                onError: (e) => Alert.alert('Report failed', String(e)),
              }
            ),
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Block this owner?', "You won't see each other anymore.", [
              {
                text: 'Block',
                style: 'destructive',
                onPress: () =>
                  block(
                    { blockerId: session.user.id, blockedId: otherOwnerId },
                    {
                      onSuccess: () =>
                        Alert.alert('Blocked', "You won't see each other anymore."),
                      onError: (e) => Alert.alert('Block failed', String(e)),
                    }
                  ),
              },
              { text: 'Cancel', style: 'cancel' },
            ]),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    };

    return (
      <View style={styles.item}>
        <Pressable
          style={styles.itemTap}
          onPress={() => router.push('/dog/' + otherDog.id)}
        >
          {otherDog.primary_photo_url ? (
            <Image
              source={{ uri: otherDog.primary_photo_url }}
              style={styles.avatar}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {otherDog.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.itemInfo}>
            <Text style={styles.dogName} numberOfLines={1}>{otherDog.name}</Text>
            {otherDog.owner?.display_name ? (
              <Text style={styles.ownerName} numberOfLines={1}>
                {otherDog.owner.display_name}
              </Text>
            ) : null}
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.messageButton, pressed && { opacity: 0.6 }]}
          onPress={() => router.push('/chat/' + match.id)}
        >
          <Text style={styles.messageText}>Message</Text>
          <Text style={styles.messageArrow}>→</Text>
        </Pressable>
        <Pressable onPress={handleMore} hitSlop={12} style={styles.moreButton}>
          <Text style={styles.moreText}>⋯</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/swipe'))}
          hitSlop={12}
        >
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Matches</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyKicker}>Keep swiping. People will swipe back.</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
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
    paddingBottom: 16,
  },
  back: {
    color: colors.textSoft,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontFamily: fonts.displayHeavy,
    letterSpacing: tracking.tightDisplay,
  },
  headerSpacer: {
    width: 60,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bodyBold,
  },
  emptyKicker: {
    color: colors.textSoft,
    fontSize: 14,
    fontFamily: fonts.body,
    marginTop: 6,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 12,
    gap: 14,
  },
  itemTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radii.tile,
  },
  avatarFallback: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.textSoft,
    fontSize: 22,
    fontFamily: fonts.displayHeavy,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  dogName: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    letterSpacing: tracking.display,
  },
  ownerName: {
    color: colors.textSoft,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  messageText: {
    color: colors.accent,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
  messageArrow: {
    color: colors.accent,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
  moreButton: {
    paddingHorizontal: 4,
  },
  moreText: {
    color: colors.textMute,
    fontFamily: fonts.bodyMedium,
    fontSize: 22,
  },
});
