import { Link } from 'expo-router';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  type SharedValue
} from 'react-native-reanimated';

import { GUTTER, SPACING } from '@/feature/common/constants/layout';

import { CourseBanner } from './course-banner';

const PARALLAX = 0.45;

type CourseHeroProps = { uri?: string | null; scrollOffset: SharedValue<number> };

/** Full-width course banner that scrolls away at a slower rate than the page, and the target of the zoom from a course card. */
export function CourseHero({ uri, scrollOffset }: CourseHeroProps) {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const height = Math.round((width * 9) / 16);

  const imageStyle = useAnimatedStyle(() => {
    if (reducedMotion) return { transform: [{ translateY: 0 }] };

    const translateY = interpolate(scrollOffset.get(), [0, height], [0, height * PARALLAX], Extrapolation.CLAMP);

    return { transform: [{ translateY }] };
  });

  return (
    <Link.AppleZoomTarget>
      <Animated.View style={[styles.frame, { height }]}>
        <Animated.View style={[styles.fill, imageStyle]}>
          <CourseBanner uri={uri} style={styles.fill} />
        </Animated.View>
      </Animated.View>
    </Link.AppleZoomTarget>
  );
}

const styles = StyleSheet.create({
  frame: { marginHorizontal: -GUTTER, marginTop: -SPACING.xs, overflow: 'hidden' },
  fill: { flex: 1 }
});
