import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming
} from 'react-native-reanimated';

import { RADII } from '@/feature/common/constants/layout';
import { EASE_IN_OUT, EASE_OUT } from '@/feature/common/constants/motion';
import { useTheme } from '@/feature/common/helpers/use-theme';

const ENTER_DELAY_MS = 180;
const HOLD_MS = 900;

type FlashHighlightProps = {
  /** Flashes once each time this turns true. */
  active: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Washes the row in the brand colour and fades it out, to point at something the user just added. */
export function FlashHighlight({ active, style, children }: FlashHighlightProps) {
  const { colors, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const tintStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  useEffect(() => {
    if (!active) {
      opacity.set(withTiming(0, { duration: 200, easing: EASE_OUT }));
      return;
    }

    opacity.set(
      withDelay(
        ENTER_DELAY_MS,
        withSequence(
          withTiming(1, { duration: reducedMotion ? 0 : 240, easing: EASE_OUT }),
          withDelay(HOLD_MS, withTiming(0, { duration: 700, easing: EASE_IN_OUT }))
        )
      )
    );
  }, [active, opacity, reducedMotion]);

  return (
    <View style={style}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.tint, { borderColor: colors.ring }, tintStyle]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary, opacity: isDark ? 0.2 : 0.08 }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  tint: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    left: -8,
    right: -8,
    borderWidth: StyleSheet.hairlineWidth * 3,
    borderRadius: RADII.xl + 4,
    borderCurve: 'continuous',
    overflow: 'hidden'
  }
});
