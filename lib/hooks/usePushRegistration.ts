import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/lib/auth-store';
import { useUpsertPushToken } from '@/lib/queries/useUpsertPushToken';

/**
 * Registers an Expo push token for the signed-in user. No-op on web (the
 * `expo-notifications` module is native-only) and silent on missing modules.
 */
export function usePushRegistration() {
  const session = useAuth((s) => s.session);
  const upsert = useUpsertPushToken();

  useEffect(() => {
    if (!session?.user?.id) return;
    if (Platform.OS === 'web') return;

    let cancelled = false;
    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        // expo-device is optional; load via dynamic import string to avoid hard
        // type dependency. If missing, assume real device on native.
        const deviceModName = 'expo-device';
        let isDevice = true;
        try {
          const Device = (await import(/* @vite-ignore */ deviceModName)) as {
            isDevice?: boolean;
          };
          if (typeof Device.isDevice === 'boolean') isDevice = Device.isDevice;
        } catch {
          // optional dep missing — proceed
        }
        if (!isDevice) return;

        const settings = await Notifications.getPermissionsAsync();
        let status = settings.status;
        if (status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          status = req.status;
        }
        if (status !== 'granted') return;

        const tokenResp = await Notifications.getExpoPushTokenAsync();
        const expoToken = tokenResp.data;
        if (!expoToken || cancelled) return;

        await upsert.mutateAsync({
          userId: session.user.id,
          expoToken,
          deviceLabel: Platform.OS,
        });
      } catch {
        // expo-notifications or expo-device not installed; skip silently.
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);
}
