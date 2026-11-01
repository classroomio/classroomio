import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretUpIcon } from 'phosphor-react-native/src/icons/CaretUp';
import { DotsSixVerticalIcon } from 'phosphor-react-native/src/icons/DotsSixVertical';
import { createContext, use, useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { DURATION, EASE_OUT } from '@/feature/common/constants/motion';
import { selectionHaptic, tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { Icon } from './icon';
import { PressableScale } from './pressable-scale';

const SETTLE_SPRING = { duration: 400, dampingRatio: 0.8, reduceMotion: ReduceMotion.System } as const;
const LONG_PRESS_MS = 180;
const LIFT_SCALE = 1.03;
const EDGE_RESISTANCE = 0.35;

type Positions = Record<string, number>;

/** Screen reader copy for the list, supplied in the app language by the caller. */
export type SortableListLabels = {
  itemPosition: (label: string, position: number, total: number) => string;
  hint: string;
  moveUp: string;
  moveDown: string;
};

type SortableListValue = {
  labels: SortableListLabels;
  ids: string[];
  stride: number;
  itemHeight: number;
  disabled: boolean;
  positions: SharedValue<Positions>;
  activeId: SharedValue<string | null>;
  commit: (positions: Positions) => void;
  move: (id: string, delta: number) => void;
  onDragActiveChange?: (active: boolean) => void;
};

const SortableListContext = createContext<SortableListValue | null>(null);
const SortableItemContext = createContext<{ id: string; index: number; total: number } | null>(null);

function useSortableList() {
  const value = use(SortableListContext);
  if (!value) throw new Error('Sortable parts must be used inside SortableList');

  return value;
}

function useSortableItem() {
  const value = use(SortableItemContext);
  if (!value) throw new Error('Sortable item parts must be used inside SortableItem');

  return value;
}

function positionsOf(ids: string[]): Positions {
  return Object.fromEntries(ids.map((id, index) => [id, index]));
}

function orderedIds(positions: Positions) {
  return Object.keys(positions).sort((left, right) => (positions[left] ?? 0) - (positions[right] ?? 0));
}

type SortableListProps = {
  /** Item ids in their current order. */
  ids: string[];
  /** Every row has this height; text inside should be clamped to fit. */
  itemHeight: number;
  gap?: number;
  disabled?: boolean;
  onReorder: (ids: string[]) => void;
  /** Lets a parent scroll view stop scrolling while a row is held. */
  onDragActiveChange?: (active: boolean) => void;
  labels: SortableListLabels;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** A vertical list whose rows can be dragged (long press) or moved with buttons and accessibility actions. */
export function SortableList({
  ids,
  itemHeight,
  gap = SPACING.xs,
  disabled = false,
  onReorder,
  onDragActiveChange,
  labels,
  style,
  children
}: SortableListProps) {
  const stride = itemHeight + gap;
  const positions = useSharedValue<Positions>(positionsOf(ids));
  const activeId = useSharedValue<string | null>(null);
  const idsKey = ids.join('\u0000');

  useEffect(() => {
    if (activeId.get() === null) positions.set(positionsOf(idsKey.split('\u0000')));
  }, [idsKey, positions, activeId]);

  const commit = (next: Positions) => {
    const nextIds = orderedIds(next);
    if (nextIds.join('\u0000') !== idsKey) onReorder(nextIds);
  };

  const move = (id: string, delta: number) => {
    const from = ids.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return;

    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, id);
    selectionHaptic();
    positions.set(positionsOf(next));
    onReorder(next);
  };

  return (
    <SortableListContext
      value={{ labels, ids, stride, itemHeight, disabled, positions, activeId, commit, move, onDragActiveChange }}
    >
      <View accessibilityRole="list" style={[{ height: Math.max(0, ids.length * stride - gap) }, style]}>
        {children}
      </View>
    </SortableListContext>
  );
}

type SortableItemProps = { id: string; accessibilityLabel: string; style?: StyleProp<ViewStyle>; children: ReactNode };

export function SortableItem({ id, accessibilityLabel, style, children }: SortableItemProps) {
  const { colors, elevation } = useTheme();
  const reducedMotion = useReducedMotion();
  const { labels, ids, stride, itemHeight, disabled, positions, activeId, commit, move, onDragActiveChange } =
    useSortableList();
  const index = ids.indexOf(id);
  const total = ids.length;
  const maxY = (total - 1) * stride;

  const translateY = useSharedValue(index * stride);
  const lift = useSharedValue(0);
  const startY = useSharedValue(0);

  useAnimatedReaction(
    () => positions.get()[id] ?? 0,
    (position, previous) => {
      if (position === previous || activeId.get() === id) return;

      translateY.set(previous === null ? position * stride : withSpring(position * stride, SETTLE_SPRING));
    }
  );

  const setDragging = (active: boolean) => onDragActiveChange?.(active);

  const pan = usePanGesture({
    enabled: !disabled && total > 1,
    activateAfterLongPress: LONG_PRESS_MS,
    onActivate: () => {
      'worklet';
      activeId.set(id);
      startY.set(translateY.get());
      lift.set(withTiming(1, { duration: DURATION.fast, easing: EASE_OUT }));
      scheduleOnRN(tapHaptic);
      scheduleOnRN(setDragging, true);
    },
    onUpdate: (event) => {
      'worklet';
      const raw = startY.get() + event.translationY;
      const y = raw < 0 ? raw * EDGE_RESISTANCE : raw > maxY ? maxY + (raw - maxY) * EDGE_RESISTANCE : raw;
      translateY.set(y);

      const current = positions.get();
      const from = current[id] ?? 0;
      const to = Math.min(total - 1, Math.max(0, Math.round(y / stride)));
      if (to === from) return;

      const next: Positions = { ...current };
      for (const key of Object.keys(next)) {
        const position = next[key] ?? 0;
        if (key === id) next[key] = to;
        else if (to > from && position > from && position <= to) next[key] = position - 1;
        else if (to < from && position >= to && position < from) next[key] = position + 1;
      }
      positions.set(next);
      scheduleOnRN(selectionHaptic);
    },
    onDeactivate: (event) => {
      'worklet';
      const target = (positions.get()[id] ?? 0) * stride;
      translateY.set(withSpring(target, { ...SETTLE_SPRING, velocity: event.velocityY }));
      scheduleOnRN(tapHaptic);
      scheduleOnRN(commit, positions.get());
    },
    onFinalize: () => {
      'worklet';
      if (activeId.get() !== id) return;

      activeId.set(null);
      lift.set(withTiming(0, { duration: DURATION.base, easing: EASE_OUT }));
      scheduleOnRN(setDragging, false);
    }
  });

  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: activeId.get() === id ? 10 : 0,
    transform: [{ translateY: translateY.get() }, { scale: reducedMotion ? 1 : 1 + (LIFT_SCALE - 1) * lift.get() }]
  }));
  const shadowStyle = useAnimatedStyle(() => ({ opacity: lift.get() }));

  return (
    <SortableItemContext value={{ id, index, total }}>
      <GestureDetector gesture={pan}>
        <Animated.View
          accessible
          accessibilityLabel={labels.itemPosition(accessibilityLabel, index + 1, total)}
          accessibilityHint={labels.hint}
          accessibilityActions={[
            { name: 'moveUp', label: labels.moveUp },
            { name: 'moveDown', label: labels.moveDown }
          ]}
          onAccessibilityAction={(event) => move(id, event.nativeEvent.actionName === 'moveUp' ? -1 : 1)}
          style={[styles.item, { height: itemHeight }, animatedStyle]}
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.fill, { borderRadius: RADII.lg }, elevation.floating, shadowStyle]}
          />
          <View
            style={[
              styles.surface,
              { height: itemHeight, backgroundColor: colors.surface, borderColor: colors.border },
              elevation.raised,
              style
            ]}
          >
            {children}
          </View>
        </Animated.View>
      </GestureDetector>
    </SortableItemContext>
  );
}

export function SortableHandle() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={styles.handle}>
      <Icon icon={DotsSixVerticalIcon} size={18} tone="subtle" />
    </View>
  );
}

export function SortableMoveButtons() {
  const { move, disabled } = useSortableList();
  const { id, index, total } = useSortableItem();

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.moves}>
      <PressableScale
        hitSlop={HIT_SLOP}
        disabled={disabled || index === 0}
        onPress={() => move(id, -1)}
        style={[styles.move, (disabled || index === 0) && styles.moveDisabled]}
      >
        <Icon icon={CaretUpIcon} size={18} tone="muted" />
      </PressableScale>
      <PressableScale
        hitSlop={HIT_SLOP}
        disabled={disabled || index === total - 1}
        onPress={() => move(id, 1)}
        style={[styles.move, (disabled || index === total - 1) && styles.moveDisabled]}
      >
        <Icon icon={CaretDownIcon} size={18} tone="muted" />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { position: 'absolute', top: 0, left: 0, right: 0 },
  fill: { ...StyleSheet.absoluteFill },
  surface: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingLeft: SPACING.xs,
    paddingRight: SPACING.xxs,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  handle: { width: 24, alignItems: 'center', justifyContent: 'center' },
  moves: { flexDirection: 'row', alignItems: 'center' },
  move: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  moveDisabled: { opacity: 0.3 }
});
