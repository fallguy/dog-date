import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useAuth } from '@/lib/auth-store';
import { useVideoPoller } from '@/lib/hooks/useVideoPoller';
import { queryClient } from '@/lib/query-client';

// Tiny side-effect-only component that runs the global video polling
// loop while the user has a pending generation. Mounted once inside the
// QueryClientProvider so it has access to the query cache.
function VideoPoller() {
  useVideoPoller();
  return null;
}

export default function RootLayout() {
  const isInitialized = useAuth((s) => s.isInitialized);
  const initialize = useAuth((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={DarkTheme}>
          {isInitialized ? (
            <>
              <VideoPoller />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="generate-video" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="swipe" options={{ animation: 'fade' }} />
              </Stack>
            </>
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0B0B0F',
              }}
            >
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          <StatusBar style="light" />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
