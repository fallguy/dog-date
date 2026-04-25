import { Redirect, router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-store';
import { useModerationQueue, type ModerationRow } from '@/lib/queries/useModerationQueue';

function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${yyyy}-${mm}-${dd} ${hours}:${minutes} ${ampm}`;
}

export default function ModerationScreen() {
  const session = useAuth((s) => s.session);
  const { data: rows = [], isLoading } = useModerationQueue();

  if (!session) {
    return <Redirect href="/" />;
  }

  const allowList = (process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const isAdmin = !!session.user.email && allowList.includes(session.user.email);

  const renderItem = ({ item }: { item: ModerationRow }) => {
    const statusColor = item.status === 'open' ? '#f59e0b' : '#5a5a60';
    return (
      <View style={styles.row}>
        <Text style={styles.names}>
          {item.reporter_name ?? 'Unknown'} → {item.target_name ?? 'Unknown'}
        </Text>
        <Text style={styles.muted}>{item.reason}</Text>
        {item.notes ? <Text style={styles.muted}>{item.notes}</Text> : null}
        <Text style={styles.timestamp}>{formatCreatedAt(item.created_at)}</Text>
        <View style={[styles.pill, { backgroundColor: statusColor }]}>
          <Text style={styles.pillText}>{item.status}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
          hitSlop={12}
        >
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Moderation</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!isAdmin ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Not authorized</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Queue is empty</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.report_id}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#9a9aa0',
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 10,
  },
  row: {
    backgroundColor: '#1a1a20',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    position: 'relative',
  },
  names: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  muted: {
    color: '#9a9aa0',
    fontSize: 13,
  },
  timestamp: {
    color: '#5a5a60',
    fontSize: 11,
    marginTop: 2,
  },
  pill: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
