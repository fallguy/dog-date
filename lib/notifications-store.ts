import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';

const STORAGE_KEY = 'dog-date-notifications';

type NotificationsState = {
  lastSeenVideoUrl: string | null;
  _hasHydrated: boolean;
  markSeen: (url: string) => void;
  _hydrate: () => Promise<void>;
};

const canUseStorage = () =>
  !(Platform.OS === 'web' && typeof window === 'undefined');

export const useNotifications = create<NotificationsState>((set, get) => ({
  lastSeenVideoUrl: null,
  _hasHydrated: false,
  markSeen: (url) => {
    set({ lastSeenVideoUrl: url });
    if (!canUseStorage()) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ lastSeenVideoUrl: url })).catch(() => {});
  },
  _hydrate: async () => {
    if (get()._hasHydrated || !canUseStorage()) {
      set({ _hasHydrated: true });
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { lastSeenVideoUrl?: string | null };
        set({ lastSeenVideoUrl: parsed.lastSeenVideoUrl ?? null, _hasHydrated: true });
      } else {
        set({ _hasHydrated: true });
      }
    } catch {
      set({ _hasHydrated: true });
    }
  },
}));

if (canUseStorage()) {
  useNotifications.getState()._hydrate();
}
