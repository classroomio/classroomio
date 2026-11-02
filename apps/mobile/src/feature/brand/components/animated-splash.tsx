import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { SPLASH, SPLASH_LOCKUP, SPLASH_TIMING } from '@/feature/brand/constants/splash';
import { FONT_FAMILY } from '@/feature/common/constants/typography';
import { EASE_IN_OUT, EASE_OUT } from '@/feature/common/constants/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MARK_RATIO = 666 / 916;
const DOT_RADIUS = 173;
const LOCKUP_SCALE = SPLASH_LOCKUP.markWidth / SPLASH.markWidth;

function SplashGlow({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="splash-glow" cx="50%" cy="0%" rx="85%" ry="70%" fx="50%" fy="0%">
          <Stop offset="0" stopColor={SPLASH.glow} stopOpacity={1} />
          <Stop offset="0.7" stopColor={SPLASH.glow} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#splash-glow)" />
    </Svg>
  );
}

function SplashMark({ dotRadius }: { dotRadius: ReturnType<typeof useSharedValue<number>> }) {
  const dotProps = useAnimatedProps(() => ({ r: dotRadius.get() }));

  return (
    <Svg width={SPLASH.markWidth} height={SPLASH.markWidth * MARK_RATIO} viewBox="55 180 916 666">
      <Path d="M385 180 H518 Q528 180 528 190 V836 Q528 846 518 846 H385 A333 333 0 0 1 385 180 Z" fill={SPLASH.mark} />
      <AnimatedCircle cx={796} cy={353} animatedProps={dotProps} fill={SPLASH.mark} />
      <Path
        d="M748 595 H961 Q971 595 971 605 V836 Q971 846 961 846 H601 Q591 846 591 836 V752 A157 157 0 0 1 748 595 Z"
        fill={SPLASH.mark}
      />
    </Svg>
  );
}

type AnimatedSplashProps = {
  /** True once fonts and the session have loaded and the app beneath can be shown. */
  ready: boolean;
};

/**
 * Continues the native splash with the same frame, then forms the ClassroomIO lockup and fades into the app.
 * Renders nothing once it has finished.
 */
export function AnimatedSplash({ ready }: AnimatedSplashProps) {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [finished, setFinished] = useState(false);
  const [wordmarkWidth, setWordmarkWidth] = useState<number | null>(null);

  const glow = useSharedValue(0);
  const dotRadius = useSharedValue(DOT_RADIUS);
  const lockup = useSharedValue(0);
  const wordmark = useSharedValue(0);
  const exit = useSharedValue(0);

  const canAnimate = ready && (reducedMotion || wordmarkWidth !== null);

  useEffect(() => {
    if (!canAnimate) return;

    void SplashScreen.hideAsync();
    const finish = () => setFinished(true);

    if (reducedMotion) {
      exit.set(
        withTiming(1, { duration: SPLASH_TIMING.reducedMotionExit, easing: EASE_OUT }, (done) => {
          if (done) scheduleOnRN(finish);
        })
      );
      return;
    }

    glow.set(withTiming(1, { duration: SPLASH_TIMING.glowIn, easing: EASE_OUT }));
    dotRadius.set(
      withDelay(
        SPLASH_TIMING.dotPopDelay,
        withTiming(DOT_RADIUS, { duration: SPLASH_TIMING.dotPop + 160, easing: EASE_OUT })
      )
    );
    lockup.set(
      withDelay(SPLASH_TIMING.lockupDelay, withTiming(1, { duration: SPLASH_TIMING.lockup, easing: EASE_IN_OUT }))
    );
    wordmark.set(
      withDelay(SPLASH_TIMING.wordmarkDelay, withTiming(1, { duration: SPLASH_TIMING.wordmark, easing: EASE_OUT }))
    );
    exit.set(
      withDelay(
        SPLASH_TIMING.holdUntilExit,
        withTiming(1, { duration: SPLASH_TIMING.exit, easing: EASE_OUT }, (done) => {
          if (done) scheduleOnRN(finish);
        })
      )
    );
  }, [canAnimate, reducedMotion, glow, dotRadius, lockup, wordmark, exit]);

  const measuredWordmark = wordmarkWidth ?? 0;
  const markEndX = -(SPLASH_LOCKUP.gap + measuredWordmark) / 2;
  const wordmarkX = (SPLASH_LOCKUP.markWidth + SPLASH_LOCKUP.gap) / 2;

  const overlayStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.get() }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.get() }));
  const lockupStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - exit.get() * 2),
    transform: [{ scale: 1 + exit.get() * 0.06 }]
  }));
  const markStyle = useAnimatedStyle(() => {
    const progress = lockup.get();

    return {
      transform: [{ translateX: markEndX * progress }, { scale: 1 + (LOCKUP_SCALE - 1) * progress }]
    };
  });
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmark.get(),
    transform: [{ translateX: wordmarkX - 10 * (1 - wordmark.get()) }]
  }));

  if (finished) return null;

  const measureWordmark = (event: LayoutChangeEvent) => {
    if (wordmarkWidth === null) setWordmarkWidth(event.nativeEvent.layout.width);
  };

  return (
    <Animated.View
      pointerEvents={canAnimate ? 'none' : 'auto'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
    >
      <StatusBar style="light" />
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <SplashGlow width={width} height={height} />
      </Animated.View>
      <Animated.View style={[styles.center, lockupStyle]}>
        <Animated.View style={[styles.layer, markStyle]}>
          <SplashMark dotRadius={dotRadius} />
        </Animated.View>
        {ready && (
          <Animated.Text
            onLayout={measureWordmark}
            numberOfLines={1}
            style={[styles.layer, styles.wordmark, wordmarkStyle]}
          >
            classroomio
          </Animated.Text>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: SPLASH.background, zIndex: 1000 },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  layer: { position: 'absolute' },
  wordmark: {
    fontFamily: FONT_FAMILY.extrabold,
    fontSize: SPLASH_LOCKUP.wordmarkSize,
    lineHeight: SPLASH_LOCKUP.wordmarkSize * 1.15,
    letterSpacing: -SPLASH_LOCKUP.wordmarkSize * 0.03,
    color: SPLASH.mark
  }
});
