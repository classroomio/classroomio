import { useEffect, useEffectEvent } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { EASE_OUT } from '@/feature/common/constants/motion';
import { TEXT_VARIANTS } from '@/feature/common/constants/typography';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const FILL_DURATION = 900;
const FILL_DELAY = 250;

type ScoreRingProps = {
  /** 0–100. */
  percent: number;
  /** Fills from zero and counts up; otherwise shows the score at rest. */
  reveal: boolean;
  /** Called once the ring has filled, or right away when it doesn't animate. */
  onFilled?: () => void;
  size?: number;
  strokeWidth?: number;
};

/** The exercise score as a ring with the percentage in the middle. */
export function ScoreRing({ percent, reveal, onFilled, size = 92, strokeWidth = 6 }: ScoreRingProps) {
  const { colors } = useTheme();
  const format = useFormatters();
  const reducedMotion = useReducedMotion();
  const animate = reveal && !reducedMotion;
  const value = Math.min(100, Math.max(0, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const finalLabel = format.percent(value);
  const steps = Array.from({ length: Math.floor(value) + 1 }, (_, step) => format.percent(step));
  const progress = useSharedValue(animate ? 0 : 1);
  const filled = useEffectEvent(() => onFilled?.());

  useEffect(() => {
    if (!animate) {
      filled();
      return;
    }

    const done = () => filled();
    progress.set(
      withDelay(
        FILL_DELAY,
        withTiming(1, { duration: FILL_DURATION, easing: EASE_OUT }, (finished) => {
          if (finished) scheduleOnRN(done);
        })
      )
    );
  }, [animate, progress]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - (value / 100) * progress.get())
  }));
  const labelProps = useAnimatedProps(() => {
    const current = progress.get();
    const text = current >= 1 ? finalLabel : (steps[Math.floor(value * current)] ?? finalLabel);

    // TextInput's native `text` prop is untyped; it updates the label without a React render.
    return { text, defaultValue: text } as unknown as TextInputProps;
  });

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={finalLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.sandStrong}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={ringProps}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <AnimatedTextInput
          editable={false}
          underlineColorAndroid="transparent"
          defaultValue={animate ? (steps[0] ?? finalLabel) : finalLabel}
          animatedProps={labelProps}
          maxFontSizeMultiplier={1.4}
          importantForAccessibility="no"
          accessibilityElementsHidden
          style={[TEXT_VARIANTS.heading, styles.label, { color: colors.ink }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { fontVariant: ['tabular-nums'], textAlign: 'center', padding: 0, minWidth: 64 }
});
