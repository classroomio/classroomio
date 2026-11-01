import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { DURATION, EASE_OUT, PRESS_SCALE } from '@/feature/common/constants/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_RETENTION = { top: 20, right: 20, bottom: 20, left: 20 } as const;

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
};

export function PressableScale({ scaleTo = PRESS_SCALE, onPressIn, onPressOut, style, ...props }: PressableScaleProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      pressRetentionOffset={PRESS_RETENTION}
      {...props}
      onPressIn={(event) => {
        if (!reducedMotion) scale.set(withTiming(scaleTo, { duration: DURATION.press, easing: EASE_OUT }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withTiming(1, { duration: DURATION.fast, easing: EASE_OUT }));
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}
