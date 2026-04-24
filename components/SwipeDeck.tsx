import { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DogCard } from '@/components/DogCard';
import type { Dog } from '@/lib/demo-dogs';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const SWIPE_OUT_DURATION = 260;

type Props = {
  dogs: Dog[];
  onSwiped?: (dog: Dog, direction: 'like' | 'pass') => void;
  onDeckEmpty?: () => void;
};

export function SwipeDeck({ dogs, onSwiped, onDeckEmpty }: Props) {
  const [index, setIndex] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const current = dogs[index];
  const next = dogs[index + 1];

  const advance = useCallback(
    (direction: 'like' | 'pass') => {
      const dog = dogs[index];
      if (dog && onSwiped) onSwiped(dog, direction);
      const nextIndex = index + 1;
      setIndex(nextIndex);
      translateX.value = 0;
      translateY.value = 0;
      if (nextIndex >= dogs.length && onDeckEmpty) onDeckEmpty();
    },
    [dogs, index, onDeckEmpty, onSwiped, translateX, translateY]
  );

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const shouldSwipeRight = e.translationX > SWIPE_THRESHOLD;
      const shouldSwipeLeft = e.translationX < -SWIPE_THRESHOLD;
      if (shouldSwipeRight || shouldSwipeLeft) {
        const direction = shouldSwipeRight ? 'like' : 'pass';
        translateX.value = withTiming(
          shouldSwipeRight ? SCREEN_WIDTH * 1.4 : -SCREEN_WIDTH * 1.4,
          { duration: SWIPE_OUT_DURATION },
          () => {
            runOnJS(advance)(direction);
          }
        );
      } else {
        translateX.value = withSpring(0, { damping: 18 });
        translateY.value = withSpring(0, { damping: 18 });
      }
    });

  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-12, 0, 12],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const passBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const nextCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    const scale = interpolate(progress, [0, 1], [0.94, 1], Extrapolation.CLAMP);
    const opacity = interpolate(progress, [0, 1], [0.8, 1], Extrapolation.CLAMP);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  if (!current) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🐕</Text>
        <Text style={styles.emptyTitle}>That&apos;s everyone nearby!</Text>
        <Text style={styles.emptySubtitle}>
          Check back later — new pups join every day.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {next && (
        <Animated.View style={[styles.cardWrap, nextCardStyle]} pointerEvents="none">
          <DogCard dog={next} />
        </Animated.View>
      )}

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.cardWrap, topCardStyle]}>
          <DogCard dog={current} />

          <Animated.View style={[styles.likeBadge, likeBadgeStyle]}>
            <Text style={styles.likeText}>LIKE</Text>
          </Animated.View>

          <Animated.View style={[styles.passBadge, passBadgeStyle]}>
            <Text style={styles.passText}>PASS</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  likeBadge: {
    position: 'absolute',
    top: 44,
    left: 24,
    borderWidth: 4,
    borderColor: '#4ade80',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    transform: [{ rotate: '-18deg' }],
  },
  likeText: {
    color: '#4ade80',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  passBadge: {
    position: 'absolute',
    top: 44,
    right: 24,
    borderWidth: 4,
    borderColor: '#f87171',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    transform: [{ rotate: '18deg' }],
  },
  passText: {
    color: '#f87171',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#9a9aa0',
    fontSize: 16,
    textAlign: 'center',
  },
});
