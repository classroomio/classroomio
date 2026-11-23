import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { EASE_IN_OUT } from '@/feature/common/constants/motion';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { FLAME } from '@/feature/goals/constants/flame';

export type FlameState = 'lit' | 'waiting' | 'out';

const OUTER =
  'M32 4C36 18 52 27 52 48C52 65 43 76 32 76C21 76 12 65 12 48C12 38 17 31 22 26C22 34 25 39 29 41C27 28 29 15 32 4Z';
const CORE =
  'M32 34C35 43 43 48 43 58C43 67 38 73 32 73C26 73 21 67 21 59C21 53 24 49 28 46C28 51 30 54 32 55C31 48 30 41 32 34Z';

const FLICKER_MS = 1100;

const GLOW_SCALE = 2.2;
// Vertical centre of the flame's body as a fraction of its height, where the glow sits.
const GLOW_CENTER = 0.62;

type StreakFlameProps = { state: FlameState; size: number };

/** A drawn flame: full colour with a slow flicker when lit, faded while today is still open, grey when out. */
export function StreakFlame({ state, size }: StreakFlameProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const flicker = useSharedValue(0);
  const animate = state === 'lit' && !reduced;

  useEffect(() => {
    if (!animate) {
      cancelAnimation(flicker);
      flicker.set(0);
      return;
    }

    flicker.set(withRepeat(withTiming(1, { duration: FLICKER_MS, easing: EASE_IN_OUT }), -1, true));

    return () => cancelAnimation(flicker);
  }, [animate, flicker]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 - flicker.get() * 0.02 }, { scaleY: 1 + flicker.get() * 0.03 }]
  }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 + flicker.get() * 0.04 }, { scaleY: 1 - flicker.get() * 0.05 }]
  }));

  const height = size * 1.25;
  const glowSize = size * GLOW_SCALE;
  const glowOpacity = state === 'out' ? 0 : state === 'lit' ? 0.55 : 0.2;
  const outerFill = state === 'out' ? colors.mutedStrong : 'url(#flame-outer)';
  const coreFill = state === 'out' ? colors.borderStrong : 'url(#flame-core)';

  return (
    <View style={{ width: size, height }} importantForAccessibility="no-hide-descendants">
      <Svg
        width={glowSize}
        height={glowSize}
        viewBox="0 0 100 100"
        pointerEvents="none"
        style={[styles.glow, { left: (size - glowSize) / 2, top: height * GLOW_CENTER - glowSize / 2 }]}
      >
        <Defs>
          <RadialGradient id="flame-glow" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={FLAME.glow} stopOpacity={glowOpacity} />
            <Stop offset="1" stopColor={FLAME.glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#flame-glow)" />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { opacity: state === 'waiting' ? 0.55 : 1 }]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.origin, outerStyle]}>
          <Svg width="100%" height="100%" viewBox="0 0 64 80">
            <Defs>
              <LinearGradient id="flame-outer" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={FLAME.tip} />
                <Stop offset="0.55" stopColor={FLAME.body} />
                <Stop offset="1" stopColor={FLAME.base} />
              </LinearGradient>
            </Defs>
            <Path d={OUTER} fill={outerFill} />
          </Svg>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.origin, coreStyle]}>
          <Svg width="100%" height="100%" viewBox="0 0 64 80">
            <Defs>
              <LinearGradient id="flame-core" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={FLAME.coreTip} />
                <Stop offset="1" stopColor={FLAME.core} />
              </LinearGradient>
            </Defs>
            <Path d={CORE} fill={coreFill} />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute' },
  origin: { transformOrigin: '50% 100%' }
});
