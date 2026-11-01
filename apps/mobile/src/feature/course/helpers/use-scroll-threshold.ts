import { useState } from 'react';
import { useAnimatedReaction, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/**
 * Tracks the scroll offset on the UI thread and re-renders only when it crosses `threshold`.
 * Returns the scroll handler, the live offset for animated styles, and whether the offset is past the threshold.
 */
export function useScrollThreshold(threshold: number) {
  const offset = useSharedValue(0);
  const [past, setPast] = useState(false);

  const onScroll = useAnimatedScrollHandler((event) => {
    offset.set(event.contentOffset.y);
  });

  useAnimatedReaction(
    () => offset.get() > threshold,
    (isPast, wasPast) => {
      if (isPast !== wasPast) scheduleOnRN(setPast, isPast);
    }
  );

  return { onScroll, offset, past };
}
