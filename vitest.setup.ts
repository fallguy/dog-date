import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Framework-boundary mocks. We mock the Expo modules that don't render
// usefully in jsdom (native bindings, video element, haptics) and the router,
// not our own code.

vi.mock('expo-video', () => ({
  useVideoPlayer: () => ({ loop: false, muted: false, play: () => {}, pause: () => {} }),
  VideoView: () => null,
}));

vi.mock('expo-image', async () => {
  const React = await import('react');
  return {
    Image: (props: Record<string, unknown>) => React.createElement('img', props as never),
  };
});

vi.mock('expo-linear-gradient', async () => {
  const React = await import('react');
  return {
    LinearGradient: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) =>
      React.createElement('div', rest as never, children),
  };
});

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn().mockResolvedValue(undefined),
  notificationAsync: vi.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

vi.mock('expo-router', () => ({
  router: { push: vi.fn(), replace: vi.fn(), back: vi.fn() },
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: { Screen: () => null },
}));

// react-native-gesture-handler ships TS source that vitest can't transpile,
// and we don't exercise real gestures in jsdom anyway. Provide minimal stubs
// so SwipeDeck's imperative API (the actual contract under test) renders.
vi.mock('react-native-gesture-handler', async () => {
  const React = await import('react');
  const noop = () => undefined;
  const chain = new Proxy(
    {},
    {
      get: () => () => chain,
    }
  );
  return {
    Gesture: {
      Pan: () => chain,
    },
    GestureDetector: ({ children }: { children?: React.ReactNode }) => children ?? null,
    GestureHandlerRootView: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    Directions: {},
    State: {},
    default: { install: noop },
  };
});

// Reanimated's worklet/JSI bindings don't exist in jsdom. Replace shared values,
// hooks, and helpers with plain JS equivalents so animated styles compute and
// the imperative withTiming() callback fires synchronously (required for the
// onSwiped contract test).
vi.mock('react-native-reanimated', async () => {
  const React = await import('react');
  const RN = await import('react-native');
  const useSharedValue = (initial: unknown) => ({ value: initial });
  const withTiming = (
    toValue: unknown,
    _config?: unknown,
    cb?: (finished: boolean) => void
  ) => {
    if (cb) cb(true);
    return toValue;
  };
  const withSpring = (toValue: unknown) => toValue;
  const interpolate = (v: number, _input: number[], output: number[]) => output[0] ?? 0;
  const useAnimatedStyle = () => ({});
  const runOnJS = <T extends (...args: unknown[]) => unknown>(fn: T) => fn;
  const View = (props: Record<string, unknown>) =>
    React.createElement(RN.View as never, props as never);
  return {
    default: { View, createAnimatedComponent: (c: unknown) => c },
    View,
    createAnimatedComponent: (c: unknown) => c,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    interpolate,
    runOnJS,
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  };
});

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    default: {
      getItem: vi.fn(async (k: string) => store.get(k) ?? null),
      setItem: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
      removeItem: vi.fn(async (k: string) => { store.delete(k); }),
      clear: vi.fn(async () => { store.clear(); }),
    },
  };
});
