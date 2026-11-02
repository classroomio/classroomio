import { Link } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  type SharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Skeleton, SkeletonGroup } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { withAlpha } from '@/feature/common/helpers/color';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { CourseBanner } from './course-banner';

const PARALLAX = 0.4;
const ARTWORK_RATIO = 0.78;

/** Total height of the hero, including the status bar area it extends under. */
export function useCourseHeroHeight() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return insets.top + Math.round(width * ARTWORK_RATIO);
}

type CourseHeroProps = {
  uri?: string | null;
  scrollOffset: SharedValue<number>;
  /** Scroll offset at which the title has passed under the navigation bar. */
  collapseAt: number;
  children?: ReactNode;
};

/**
 * The course artwork full-bleed behind the navigation bar, with the title set over it. Pulling past the top zooms
 * the artwork from its bottom edge; scrolling moves it at a slower rate than the page. The zoom from a course card
 * lands here.
 */
export function CourseHero({ uri, scrollOffset, collapseAt, children }: CourseHeroProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const height = useCourseHeroHeight();

  const stretchStyle = useAnimatedStyle(() => {
    const pull = Math.max(0, -scrollOffset.get());

    return { transform: [{ scale: 1 + pull / height }] };
  });
  const parallaxStyle = useAnimatedStyle(() => {
    if (reducedMotion) return { transform: [{ translateY: 0 }] };

    const translateY = interpolate(scrollOffset.get(), [0, height], [0, height * PARALLAX], Extrapolation.CLAMP);

    return { transform: [{ translateY }] };
  });
  const copyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollOffset.get(), [collapseAt * 0.45, collapseAt], [1, 0], Extrapolation.CLAMP)
  }));

  return (
    <Link.AppleZoomTarget>
      <View style={[styles.frame, { height, backgroundColor: colors.muted }]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.clip, stretchStyle]}>
          <Animated.View style={[StyleSheet.absoluteFill, parallaxStyle]}>
            <CourseBanner uri={uri} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="heroTop" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.artworkScrim} stopOpacity={0.42} />
                <Stop offset="0.28" stopColor={colors.artworkScrim} stopOpacity={0} />
                <Stop offset="0.42" stopColor={colors.artworkScrim} stopOpacity={0} />
                <Stop offset="1" stopColor={colors.artworkScrim} stopOpacity={0.86} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroTop)" />
          </Svg>
        </Animated.View>
        {children ? <Animated.View style={[styles.copy, copyStyle]}>{children}</Animated.View> : null}
      </View>
    </Link.AppleZoomTarget>
  );
}

export function CourseHeroTitle({ children }: { children: string }) {
  const { colors } = useTheme();

  return (
    <Text variant="display" accessibilityRole="header" numberOfLines={3} style={{ color: colors.onSolid }}>
      {children}
    </Text>
  );
}

export function CourseHeroMeta({ children }: { children: string }) {
  const { colors } = useTheme();

  return (
    <Text variant="captionStrong" numberOfLines={1} style={{ color: withAlpha(colors.onSolid, 0.82) }}>
      {children}
    </Text>
  );
}

/** Title and meta bones over the artwork while the course loads. */
export function CourseHeroSkeleton() {
  const { colors } = useTheme();

  return (
    <SkeletonGroup color={withAlpha(colors.onSolid, 0.28)} style={styles.skeleton}>
      <Skeleton width="40%" height={12} radius={RADII.xs} />
      <Skeleton width="85%" height={26} radius={RADII.xs} />
      <Skeleton width="55%" height={26} radius={RADII.xs} />
    </SkeletonGroup>
  );
}

type CourseHeaderBackdropProps = { scrollOffset: SharedValue<number>; collapseAt: number };

/** The navigation bar's background, faded in as the hero scrolls under the transparent native header. */
export function CourseHeaderBackdrop({ scrollOffset, collapseAt }: CourseHeaderBackdropProps) {
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scrollOffset.get(), [collapseAt - SPACING.xxxl, collapseAt], [0, 1], Extrapolation.CLAMP)
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.backdrop,
        { height: headerHeight, backgroundColor: colors.background, borderBottomColor: colors.border },
        style
      ]}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  frame: { marginHorizontal: -GUTTER, justifyContent: 'flex-end' },
  clip: { overflow: 'hidden', transformOrigin: 'bottom' },
  copy: { paddingHorizontal: GUTTER, paddingBottom: SPACING.lg, gap: SPACING.xxs },
  skeleton: { gap: SPACING.xs }
});
