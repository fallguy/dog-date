import { describe, it, expect, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '@/lib/notifications-store';

const STORAGE_KEY = 'dog-date-notifications';

describe('useNotifications store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useNotifications.setState({ lastSeenVideoUrl: null, _hasHydrated: false });
  });

  it('markSeen updates lastSeenVideoUrl', () => {
    useNotifications.getState().markSeen('https://v.example/x.mp4');
    expect(useNotifications.getState().lastSeenVideoUrl).toBe('https://v.example/x.mp4');
  });

  it('markSeen writes to AsyncStorage with the right key/value', async () => {
    useNotifications.getState().markSeen('https://v.example/y.mp4');
    // markSeen does not await; allow the microtask to flush.
    await new Promise((r) => setTimeout(r, 0));
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).toBe(JSON.stringify({ lastSeenVideoUrl: 'https://v.example/y.mp4' }));
  });

  it('_hydrate loads from storage and sets _hasHydrated', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lastSeenVideoUrl: 'https://v.example/z.mp4' })
    );
    await useNotifications.getState()._hydrate();
    const state = useNotifications.getState();
    expect(state.lastSeenVideoUrl).toBe('https://v.example/z.mp4');
    expect(state._hasHydrated).toBe(true);
  });
});
