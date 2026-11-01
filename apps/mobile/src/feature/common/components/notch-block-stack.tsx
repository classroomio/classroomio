import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { DURATION, EASE_IN_OUT, EASE_OUT } from '@/feature/common/constants/motion';
import { useTheme } from '@/feature/common/helpers/use-theme';

const NOTCH_PATH = 'M0 0 H46 Q41.6 0 40.4 2.6 L38 8.4 Q36.9 11 34.2 11 H11.8 Q9.1 11 8 8.4 L5.6 2.6 Q4.4 0 0 0 Z';
const CHECK_PATH = 'M10 14 L14 18 L22 10';
const CHECK_LENGTH = 17.5;

const BLOCK = { width: 104, height: 28, radius: 7, gap: 3 } as const;
const NOTCH = { width: 29, height: 7, inset: 14 } as const;
const TAB = { width: 25, height: BLOCK.gap + 5 } as const;

// The design system's block drop: a gravity fall, then a small bounce.
const FALL = Easing.bezier(0.55, 0, 0.9, 0.45);
const FALL_DISTANCE = 32;
const FALL_DURATION = 260;
const STAGGER = 80;
const CHECK_DELAY = STAGGER * 2 + FALL_DURATION + 120;
const CHECK_DURATION = 220;

/** Time from mount until the top block has landed and its check has drawn in. */
export const NOTCH_BLOCK_STACK_DURATION = CHECK_DELAY + CHECK_DURATION;

type BlockProps = {
  index: number;
  fill: string;
  cutoutColor: string;
  withTab: boolean;
  reducedMotion: boolean;
  children?: ReactNode;
};

function Block({ index, fill, cutoutColor, withTab, reducedMotion, children }: BlockProps) {
  const y = useSharedValue(reducedMotion ? 0 : -FALL_DISTANCE);
  const opacity = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get(), transform: [{ translateY: y.get() }] }));

  useEffect(() => {
    const delay = reducedMotion ? 0 : index * STAGGER;
    opacity.set(withDelay(delay, withTiming(1, { duration: reducedMotion ? DURATION.fast : 120, easing: EASE_OUT })));
    if (reducedMotion) return;

    y.set(
      withDelay(
        delay,
        withSequence(
          withTiming(0, { duration: FALL_DURATION, easing: FALL }),
          withTiming(-5, { duration: 90, easing: EASE_OUT }),
          withTiming(0, { duration: 110, easing: EASE_IN_OUT })
        )
      )
    );
  }, [index, opacity, reducedMotion, y]);

  return (
    <Animated.View style={[styles.block, { backgroundColor: fill }, style]}>
      <Svg width={NOTCH.width} height={NOTCH.height} viewBox="0 0 46 11" style={styles.notch}>
        <Path d={NOTCH_PATH} fill={cutoutColor} />
      </Svg>
      {withTab ? (
        <Svg width={TAB.width} height={TAB.height} viewBox="0 0 46 11" preserveAspectRatio="none" style={styles.tab}>
          <Path d={NOTCH_PATH} fill={fill} />
        </Svg>
      ) : null}
      {children}
    </Animated.View>
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

function Check({ progress, color }: { progress: SharedValue<number>; color: string }) {
  const props = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LENGTH * (1 - progress.get()) }));

  return (
    <Svg width={32} height={BLOCK.height} viewBox={`0 0 32 ${BLOCK.height}`}>
      <AnimatedPath
        d={CHECK_PATH}
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={CHECK_LENGTH}
        fill="none"
        animatedProps={props}
      />
    </Svg>
  );
}

type NotchBlockStackProps = {
  /** Colour behind the stack, so each notch reads as a cut-out. */
  cutoutColor: string;
};

/**
 * Three ClassroomIO notch blocks that drop in and interlock, the top one in the brand colour with a check that
 * draws in once it lands. Plays once on mount; with reduced motion the blocks fade in and the check is drawn.
 */
export function NotchBlockStack({ cutoutColor }: NotchBlockStackProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const check = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;

    check.set(withDelay(CHECK_DELAY, withTiming(1, { duration: CHECK_DURATION, easing: EASE_OUT })));
  }, [check, reducedMotion]);

  return (
    <View
      style={styles.stack}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Block
        index={0}
        fill={colors.sandStrong}
        cutoutColor={cutoutColor}
        withTab={false}
        reducedMotion={reducedMotion}
      />
      <Block index={1} fill={colors.ring} cutoutColor={cutoutColor} withTab reducedMotion={reducedMotion} />
      <Block index={2} fill={colors.primary} cutoutColor={cutoutColor} withTab reducedMotion={reducedMotion}>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Check progress={check} color={colors.onPrimary} />
        </View>
      </Block>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'column-reverse', alignItems: 'center', gap: BLOCK.gap },
  block: {
    width: BLOCK.width,
    height: BLOCK.height,
    borderRadius: BLOCK.radius,
    borderCurve: 'continuous'
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  notch: { position: 'absolute', top: 0, left: NOTCH.inset },
  tab: {
    position: 'absolute',
    top: BLOCK.height - 1,
    left: NOTCH.inset + (NOTCH.width - TAB.width) / 2 - 0.4
  }
});
