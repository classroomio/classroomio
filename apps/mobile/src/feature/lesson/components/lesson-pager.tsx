import { ContentType } from '@cio/utils/constants/content';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { createContext, use, type ReactNode } from 'react';
import { RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, useManualGesture, usePanGesture, type PanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { DURATION, EASE_OUT } from '@/feature/common/constants/motion';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { isAccessible } from '@/feature/course/helpers/course-content';
import type { CourseContentItem } from '@/feature/course/types/course-detail';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import type { LessonDirection } from '@/feature/lesson/helpers/open-neighbor';
import { lessonCatalog } from '@/feature/lesson/translations/catalog';

const ACTIVATE_DISTANCE = 18;
const VERTICAL_TOLERANCE = 12;
const MIN_COMMIT_DISTANCE = 32;
const COMMIT_FRACTION = 0.4;
const ARM_FRACTION = 0.28;
const HINT_SIZE = 40;

function project(velocity: number) {
  'worklet';
  const decelerationRate = 0.998;

  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

function rubberband(overshoot: number, dimension: number) {
  'worklet';
  const constant = 0.55;

  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

type LessonPagerContextValue = { pan: PanGesture; blocked: SharedValue<boolean> };

const LessonPagerContext = createContext<LessonPagerContextValue | null>(null);

type LessonPagerProps = {
  previous: CourseContentItem | null;
  next: CourseContentItem | null;
  onNavigate: (item: CourseContentItem, direction: LessonDirection) => void;
  refreshing: boolean;
  onRefresh: () => void;
  children: ReactNode;
};

/**
 * The lesson reader: a scroll view with a reading-progress bar under the header, where a horizontal swipe on the
 * content moves to the previous or next course item. Media inside `LessonSwipeExclusion` keeps its own gestures.
 */
export function LessonPager({ previous, next, onNavigate, refreshing, onRefresh, children }: LessonPagerProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const origin = useSharedValue(0);
  const blocked = useSharedValue(false);
  const ignored = useSharedValue(false);
  const progress = useSharedValue(0);
  const scrolled = useSharedValue(0);
  const canPrevious = Boolean(previous && isAccessible(previous));
  const canNext = Boolean(next && isAccessible(next));

  const navigate = (direction: LessonDirection) => {
    const target = direction === 'next' ? next : previous;
    if (target) onNavigate(target, direction);
  };

  const pan = usePanGesture({
    activeOffsetX: [-ACTIVATE_DISTANCE, ACTIVATE_DISTANCE],
    failOffsetY: [-VERTICAL_TOLERANCE, VERTICAL_TOLERANCE],
    hitSlop: { left: -GUTTER },
    onActivate: () => {
      'worklet';
      ignored.set(blocked.get());
      origin.set(x.get());
    },
    onUpdate: (event) => {
      'worklet';
      if (ignored.get()) return;

      const raw = origin.get() + event.translationX;
      const open = raw < 0 ? canNext : canPrevious;
      x.set(open ? Math.max(-width, Math.min(width, raw)) : rubberband(raw, width));
    },
    onDeactivate: (event) => {
      'worklet';
      const projected = x.get() + project(event.velocityX);
      const direction: LessonDirection = projected < 0 ? 'next' : 'previous';
      const open = direction === 'next' ? canNext : canPrevious;
      const commit =
        !ignored.get() &&
        !event.canceled &&
        open &&
        Math.abs(x.get()) > MIN_COMMIT_DISTANCE &&
        Math.abs(projected) > width * COMMIT_FRACTION;

      if (commit) {
        x.set(
          withSpring(direction === 'next' ? -width : width, {
            duration: 300,
            dampingRatio: 1,
            velocity: event.velocityX,
            overshootClamping: true,
            reduceMotion: ReduceMotion.System
          })
        );
        scheduleOnRN(navigate, direction);
        return;
      }

      x.set(
        withSpring(0, {
          duration: 400,
          dampingRatio: 0.8,
          velocity: event.velocityX,
          reduceMotion: ReduceMotion.System
        })
      );
    },
    onFinalize: () => {
      'worklet';
      blocked.set(false);
      ignored.set(false);
    }
  });

  useAnimatedReaction(
    () => (x.get() < -width * ARM_FRACTION && canNext) || (x.get() > width * ARM_FRACTION && canPrevious),
    (armed, wasArmed) => {
      if (armed && wasArmed === false) scheduleOnRN(tapHaptic);
    }
  );

  const onScroll = useAnimatedScrollHandler((event) => {
    const range = event.contentSize.height - event.layoutMeasurement.height;
    const offset = event.contentOffset.y;
    progress.set(range > 48 ? Math.min(1, Math.max(0, offset / range)) : 0);
    const shown = offset > 4 && range > 48 ? 1 : 0;
    if (scrolled.get() !== shown) scrolled.set(shown);
  });

  const contentStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const trackStyle = useAnimatedStyle(() => ({
    opacity: withTiming(scrolled.get(), { duration: DURATION.fast, easing: EASE_OUT })
  }));
  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.get() }] }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        scrollEventThrottle={16}
        onScroll={onScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.inkMuted} />}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.scrollContent}
      >
        <LessonPagerContext value={{ pan, blocked }}>
          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.content, contentStyle]}>{children}</Animated.View>
          </GestureDetector>
        </LessonPagerContext>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.track, { backgroundColor: colors.border }, trackStyle]}
      >
        <Animated.View style={[styles.fill, { backgroundColor: colors.primary }, fillStyle]} />
      </Animated.View>

      {canPrevious && previous ? <SwipeHint side="previous" item={previous} x={x} width={width} /> : null}
      {canNext && next ? <SwipeHint side="next" item={next} x={x} width={width} /> : null}
    </View>
  );
}

type SwipeHintProps = {
  side: LessonDirection;
  item: CourseContentItem;
  x: SharedValue<number>;
  width: number;
};

function SwipeHint({ side, item, x, width }: SwipeHintProps) {
  const { colors } = useTheme();
  const t = useTranslations(lessonCatalog);
  const sign = side === 'next' ? -1 : 1;
  const armAt = width * ARM_FRACTION;
  const label =
    side === 'previous' ? t('previous') : item.type === ContentType.Exercise ? t('nextExercise') : t('nextLesson');

  const hintStyle = useAnimatedStyle(() => {
    const distance = Math.max(0, x.get() * sign);

    return {
      opacity: interpolate(distance, [ACTIVATE_DISTANCE, armAt * 0.7], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateX: interpolate(distance, [0, armAt], [-sign * 16, 0], Extrapolation.CLAMP) }]
    };
  });
  const armedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(x.get() * sign > armAt ? 1 : 0, { duration: DURATION.press, easing: EASE_OUT })
  }));
  const arrow = side === 'next' ? ArrowRight : ArrowLeft;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.hint, side === 'next' ? styles.hintNext : styles.hintPrevious, hintStyle]}
    >
      <View style={[styles.hintCircle, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Icon icon={arrow} size={20} tone="muted" />
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.hintArmed, { backgroundColor: colors.primary }, armedStyle]}
        >
          <Icon icon={arrow} size={20} color={colors.onPrimary} />
        </Animated.View>
      </View>
      <Text variant="captionStrong" tone="muted" numberOfLines={2} style={styles.hintLabel}>
        {label}
      </Text>
    </Animated.View>
  );
}

/** Keeps touches that start inside its children (video players, embeds, slides) from turning into a lesson swipe. */
export function LessonSwipeExclusion({ children }: { children: ReactNode }) {
  const pager = use(LessonPagerContext);
  const blocked = pager?.blocked;
  const guard = useManualGesture({
    block: pager?.pan,
    cancelsTouchesInView: false,
    onTouchesDown: () => {
      'worklet';
      blocked?.set(true);
    }
  });

  if (!pager) return children;

  return (
    <GestureDetector gesture={guard}>
      <View>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  content: { paddingHorizontal: GUTTER, gap: SPACING.xl },
  track: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, transformOrigin: 'left' },
  hint: { position: 'absolute', top: '42%', width: 96, alignItems: 'center', gap: SPACING.xs },
  hintNext: { right: SPACING.xs },
  hintPrevious: { left: SPACING.xs },
  hintCircle: {
    width: HINT_SIZE,
    height: HINT_SIZE,
    borderRadius: HINT_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  hintArmed: { alignItems: 'center', justifyContent: 'center' },
  hintLabel: { textAlign: 'center' }
});
