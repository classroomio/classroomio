import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/feature/common/helpers/use-theme';
import { VIDEO_COLORS } from '@/feature/lesson/constants/playback';

const TRACK_HEIGHT = 3;
const THUMB_SIZE = 12;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

function clampFraction(value: number) {
  'worklet';
  return Math.min(1, Math.max(0, value));
}

type VideoScrubberProps = {
  currentTime: number;
  duration: number;
  bufferedPosition: number;
  enabled: boolean;
  accessibilityLabel: string;
  accessibilityValue: string;
  onScrubStart: () => void;
  /** Called with the whole second under the finger while dragging, for the time label. */
  onScrubPreview: (seconds: number) => void;
  onScrubEnd: (seconds: number) => void;
  onAccessibilityStep: (direction: 1 | -1) => void;
};

export function VideoScrubber({
  currentTime,
  duration,
  bufferedPosition,
  enabled,
  accessibilityLabel,
  accessibilityValue,
  onScrubStart,
  onScrubPreview,
  onScrubEnd,
  onAccessibilityStep
}: VideoScrubberProps) {
  const { colors } = useTheme();
  const width = useSharedValue(0);
  const dragging = useSharedValue(false);
  const dragFraction = useSharedValue(0);
  const progress = useSharedValue(0);
  const thumbScale = useSharedValue(1);
  const playedFraction = duration > 0 ? clampFraction(currentTime / duration) : 0;
  const bufferedFraction = duration > 0 ? clampFraction(bufferedPosition / duration) : 0;

  useEffect(() => {
    if (!dragging.get()) progress.set(playedFraction);
  }, [dragging, playedFraction, progress]);

  const pan = usePanGesture({
    enabled: enabled && duration > 0,
    minDistance: 0,
    hitSlop: { top: 14, bottom: 14 },
    onBegin: (event) => {
      'worklet';
      dragging.set(true);
      dragFraction.set(clampFraction(event.x / Math.max(1, width.get())));
      thumbScale.set(withTiming(1.4, { duration: 150, easing: EASE_OUT }));
      scheduleOnRN(onScrubStart);
    },
    onUpdate: (event) => {
      'worklet';
      dragFraction.set(clampFraction(event.x / Math.max(1, width.get())));
    },
    onFinalize: () => {
      'worklet';
      if (!dragging.get()) return;

      const fraction = dragFraction.get();
      dragging.set(false);
      progress.set(fraction);
      thumbScale.set(withTiming(1, { duration: 150, easing: EASE_OUT }));
      scheduleOnRN(onScrubEnd, fraction * duration);
    }
  });

  useAnimatedReaction(
    () => (dragging.get() ? Math.floor(dragFraction.get() * duration) : -1),
    (seconds, previous) => {
      if (seconds >= 0 && seconds !== previous) scheduleOnRN(onScrubPreview, seconds);
    }
  );

  const fillStyle = useAnimatedStyle(() => ({
    width: `${(dragging.get() ? dragFraction.get() : progress.get()) * 100}%`
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (dragging.get() ? dragFraction.get() : progress.get()) * width.get() - THUMB_SIZE / 2 },
      { scale: thumbScale.get() }
    ]
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: accessibilityValue }}
        accessibilityState={{ disabled: !enabled }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => onAccessibilityStep(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
        onLayout={(event) => width.set(event.nativeEvent.layout.width)}
        style={styles.hitArea}
      >
        <View style={[styles.track, { backgroundColor: VIDEO_COLORS.track }]}>
          <View
            style={[styles.layer, { width: `${bufferedFraction * 100}%`, backgroundColor: VIDEO_COLORS.buffered }]}
          />
          <Animated.View style={[styles.layer, { backgroundColor: colors.primary }, fillStyle]} />
        </View>
        {enabled ? (
          <Animated.View style={[styles.thumb, { backgroundColor: VIDEO_COLORS.control }, thumbStyle]} />
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hitArea: { height: 20, justifyContent: 'center' },
  track: { height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT, overflow: 'hidden' },
  layer: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2
  }
});
