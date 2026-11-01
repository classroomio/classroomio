import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { RADII } from '@/feature/common/constants/layout';
import { EASE_IN_OUT } from '@/feature/common/constants/motion';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { Text } from './text';

const TRACK_PADDING = 3;
const THUMB_DURATION = 250;

type SegmentLayout = { x: number; width: number };

type SegmentedControlContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  thumbPlaced: boolean;
  register: (value: string, layout: SegmentLayout) => void;
};

const SegmentedControlContext = createContext<SegmentedControlContextValue>({
  value: '',
  onValueChange: () => {},
  thumbPlaced: false,
  register: () => {}
});

type SegmentedControlProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  children: ReactNode;
};

export function SegmentedControl<T extends string>({ value, onValueChange, children }: SegmentedControlProps<T>) {
  const { colors, elevation } = useTheme();
  const reducedMotion = useReducedMotion();
  const [layouts, setLayouts] = useState<Record<string, SegmentLayout>>({});
  const thumbX = useSharedValue(0);
  const thumbWidth = useSharedValue(0);
  const placed = useRef(false);
  const selected = layouts[value];

  useEffect(() => {
    if (!selected) return;

    if (!placed.current || reducedMotion) {
      placed.current = true;
      thumbX.set(selected.x);
      thumbWidth.set(selected.width);
      return;
    }

    thumbX.set(withTiming(selected.x, { duration: THUMB_DURATION, easing: EASE_IN_OUT }));
    thumbWidth.set(withTiming(selected.width, { duration: THUMB_DURATION, easing: EASE_IN_OUT }));
  }, [selected, reducedMotion, thumbX, thumbWidth]);

  const thumbStyle = useAnimatedStyle(() => ({
    width: thumbWidth.get(),
    transform: [{ translateX: thumbX.get() }]
  }));

  const register = (segment: string, layout: SegmentLayout) => {
    setLayouts((current) => {
      const previous = current[segment];
      if (previous && previous.x === layout.x && previous.width === layout.width) return current;

      return { ...current, [segment]: layout };
    });
  };

  return (
    <SegmentedControlContext
      value={{
        value,
        onValueChange: (next) => onValueChange(next as T),
        thumbPlaced: Boolean(selected),
        register
      }}
    >
      <View accessibilityRole="tablist" style={[styles.track, { backgroundColor: colors.sandStrong }]}>
        {selected ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.thumb, { backgroundColor: colors.surface }, elevation.raised, thumbStyle]}
          />
        ) : null}
        {children}
      </View>
    </SegmentedControlContext>
  );
}

export function SegmentedControlItem({ value, children }: { value: string; children: string }) {
  const { colors, elevation } = useTheme();
  const context = use(SegmentedControlContext);
  const selected = context.value === value;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onLayout={(event) => {
        const { x, width } = event.nativeEvent.layout;
        context.register(value, { x, width });
      }}
      onPress={() => {
        if (selected) return;

        selectionHaptic();
        context.onValueChange(value);
      }}
      style={({ pressed }) => [
        styles.segment,
        selected && !context.thumbPlaced && [{ backgroundColor: colors.surface }, elevation.raised],
        pressed && !selected && styles.pressed
      ]}
    >
      <Text variant="captionStrong" tone={selected ? 'ink' : 'muted'} numberOfLines={1}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: TRACK_PADDING, borderRadius: RADII.md, borderCurve: 'continuous' },
  thumb: {
    position: 'absolute',
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: 0,
    borderRadius: RADII.input - 1,
    borderCurve: 'continuous'
  },
  segment: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.input - 1,
    borderCurve: 'continuous'
  },
  pressed: { opacity: 0.6 }
});
