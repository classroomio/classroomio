import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

import { RADII } from '@/feature/common/constants/layout';
import { EASE_IN_OUT } from '@/feature/common/constants/motion';
import { useTheme } from '@/feature/common/helpers/use-theme';

type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = '100%', height, radius = RADII.input, style }: SkeletonProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  useEffect(() => {
    if (reducedMotion) return;

    opacity.set(withRepeat(withTiming(0.5, { duration: 900, easing: EASE_IN_OUT }), -1, true));
  }, [opacity, reducedMotion]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.sandStrong }, animatedStyle, style]}
    />
  );
}
