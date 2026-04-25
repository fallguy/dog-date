import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

type NotificationsState = {
  /**
   * The most recent ai_video_url that the user has acknowledged (dismissed
   * the banner OR opened the preview modal). When the dog's current
   * ai_video_url matches this value, the "ready" banner stays hidden — so
   * returning users with an already-seen video don't get re-prompted.
   */
  lastSeenVideoUrl: string | null;
  markSeen: (url: string) => void;
};

// Expo Router does an SSR pass on web where `window` is undefined. Wrap
// AsyncStorage so calls during that phase no-op gracefully; the store
// will hydrate once the client mounts.
const safeStorage: StateStorage = {
  getItem: async (name) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return null;
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      // ignore
    }
  },
  removeItem: async (name) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const useNotifications = create<NotificationsState>()(
  persist(
    (set) => ({
      lastSeenVideoUrl: null,
      markSeen: (url) => set({ lastSeenVideoUrl: url }),
    }),
    {
      name: 'dog-date-notifications',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
