import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useAuth } from '@/lib/auth-store';
import { usePushRegistration } from '@/lib/hooks/usePushRegistration';
import { useVideoPoller } from '@/lib/hooks/useVideoPoller';
import { queryClient } from '@/lib/query-client';
import { colors } from '@/lib/theme';

// Tiny side-effect-only component that runs the global video polling
// loop while the user has a pending generation. Mounted once inside the
// QueryClientProvider so it has access to the query cache.
function VideoPoller() {
  useVideoPoller();
  return null;
}

function PushRegistration() {
  usePushRegistration();
  return null;
}

const darkPhotoTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.divider,
    primary: colors.accent,
  },
};

export default function RootLayout() {
  const isInitialized = useAuth((s) => s.isInitialized);
  const initialize = useAuth((s) => s.initialize);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={darkPhotoTheme}>
          {isInitialized && fontsLoaded ? (
            <>
              <VideoPoller />
              <PushRegistration />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="generate-video" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="swipe" options={{ animation: 'fade' }} />
                <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
              </Stack>
            </>
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.bg,
              }}
            >
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          )}
          <StatusBar style="light" />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
