import type { LucideIcon } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { SPACING } from '@/feature/common/constants/layout';
import { DURATION, EASE_OUT } from '@/feature/common/constants/motion';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { Icon } from './icon';
import { Text } from './text';

export type SwipeActionTone = 'primary' | 'success' | 'danger';

export type SwipeAction = {
  label: string;
  icon: LucideIcon;
  tone?: SwipeActionTone;
  onCommit: () => void;
};

type Side = 'leading' | 'trailing';

const COMMIT_DISTANCE = 88;
const MIN_TRAVEL = 28;
const BLOCKED_LIMIT = 20;
const SETTLE = { duration: 400, dampingRatio: 1, reduceMotion: ReduceMotion.System } as const;

function project(velocity: number, decelerationRate = 0.998) {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  'worklet';
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

function resist(raw: number, canLead: boolean, canTrail: boolean, limit: number) {
  'worklet';
  const allowed = raw > 0 ? canLead : canTrail;
  const sign = raw > 0 ? 1 : -1;
  const distance = Math.abs(raw);
  if (!allowed) return sign * rubberband(distance, BLOCKED_LIMIT);
  if (distance <= limit) return raw;

  return sign * (limit + rubberband(distance - limit, limit / 2));
}

type SwipeActionRowProps = {
  /** Identity of the row's item. The row returns to rest when it changes, so recycled list cells never open mid-swipe. */
  resetKey: string;
  /** Committed by swiping right. */
  leading?: SwipeAction;
  /** Committed by swiping left. */
  trailing?: SwipeAction;
  enabled?: boolean;
  /** Opaque fill behind the row content; defaults to the surface colour. */
  surfaceColor?: string;
  children: ReactNode;
};

/**
 * A row that commits an action when swiped past a threshold or flicked, then settles back. Release short of the
 * threshold and it springs home without doing anything. Rows still need a tap or accessibility action for the same
 * thing, since swipes are invisible to VoiceOver and TalkBack.
 */
export function SwipeActionRow({
  resetKey,
  leading,
  trailing,
  enabled = true,
  surfaceColor,
  children
}: SwipeActionRowProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const armed = useSharedValue(0);
  const canLead = Boolean(leading);
  const canTrail = Boolean(trailing);
  const limit = width * 0.5;

  useEffect(() => {
    x.set(0);
    armed.set(0);
  }, [resetKey, x, armed]);

  useAnimatedReaction(
    () => Math.abs(x.get()) >= COMMIT_DISTANCE,
    (isArmed, wasArmed) => {
      if (isArmed === wasArmed) return;

      armed.set(withTiming(isArmed ? 1 : 0, { duration: DURATION.press, easing: EASE_OUT }));
    }
  );

  const commit = (side: Side) => {
    const action = side === 'leading' ? leading : trailing;
    if (!action) return;

    tapHaptic();
    action.onCommit();
  };

  const pan = usePanGesture({
    enabled: enabled && (canLead || canTrail),
    activeOffsetX: [-12, 12],
    failOffsetY: [-10, 10],
    onActivate: () => {
      'worklet';
      start.set(x.get());
    },
    onUpdate: (event) => {
      'worklet';
      x.set(resist(start.get() + event.translationX, canLead, canTrail, limit));
    },
    onDeactivate: (event) => {
      'worklet';
      const current = x.get();
      const projected = current + project(event.velocityX);
      const side: Side = current > 0 ? 'leading' : 'trailing';
      const allowed = side === 'leading' ? canLead : canTrail;
      const commits =
        allowed &&
        Math.abs(current) >= MIN_TRAVEL &&
        Math.sign(projected) === Math.sign(current) &&
        Math.abs(projected) >= COMMIT_DISTANCE;

      x.set(withSpring(0, { ...SETTLE, velocity: event.velocityX }));
      if (commits) scheduleOnRN(commit, side);
    }
  });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View style={styles.root}>
      {leading ? <SwipeActionLayer side="leading" action={leading} x={x} armed={armed} /> : null}
      {trailing ? <SwipeActionLayer side="trailing" action={trailing} x={x} armed={armed} /> : null}
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ backgroundColor: surfaceColor ?? colors.surface }, rowStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

type SwipeActionLayerProps = {
  side: Side;
  action: SwipeAction;
  x: SharedValue<number>;
  armed: SharedValue<number>;
};

function SwipeActionLayer({ side, action, x, armed }: SwipeActionLayerProps) {
  const { colors } = useTheme();
  const tone = action.tone ?? 'primary';
  const fill = colors[tone];
  const onFill = tone === 'primary' ? colors.onPrimary : colors.background;
  const direction = side === 'leading' ? 1 : -1;

  const layerStyle = useAnimatedStyle(() => ({ opacity: x.get() * direction > 0 ? 1 : 0 }));
  const fillStyle = useAnimatedStyle(() => ({ opacity: armed.get() }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.get() * direction, [0, MIN_TRAVEL, COMMIT_DISTANCE], [0, 0.6, 1], Extrapolation.CLAMP),
    transform: [{ scale: 0.88 + 0.12 * armed.get() }]
  }));

  const content = (color: string) => (
    <>
      <Icon icon={action.icon} size={20} color={color} />
      <Text variant="captionStrong" color={color} numberOfLines={1}>
        {action.label}
      </Text>
    </>
  );

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.sandStrong }, layerStyle]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: fill }, fillStyle]} />
      <Animated.View style={[styles.content, side === 'leading' ? styles.leading : styles.trailing, contentStyle]}>
        <View style={styles.label}>{content(colors.inkMuted)}</View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.label, fillStyle]}>{content(onFill)}</Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  content: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  leading: { left: SPACING.lg },
  trailing: { right: SPACING.lg },
  label: { alignItems: 'center', justifyContent: 'center', gap: 2 }
});
