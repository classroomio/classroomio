import { X } from 'lucide-react-native';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type ScrollViewProps
} from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture, type PanGesture } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { GUTTER, HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { EASE_OUT } from '@/feature/common/constants/motion';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { Icon } from './icon';
import { Text } from './text';

const OPEN_DURATION = 300;
const CLOSE_DURATION = 220;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;

type BottomSheetContextValue = {
  open: boolean;
  close: () => void;
  unmount: () => void;
};

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

const BottomSheetDragContext = createContext<PanGesture | null>(null);

function useBottomSheet() {
  const context = use(BottomSheetContext);
  if (!context) throw new Error('BottomSheet parts must be used inside BottomSheet');

  return context;
}

type BottomSheetProps = { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode };

/** A modal sheet that slides up from the bottom edge and closes on scrim tap, back press or a downward drag on its header. */
export function BottomSheet({ open, onOpenChange, children }: BottomSheetProps) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  const close = () => onOpenChange(false);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <GestureHandlerRootView style={styles.root}>
        <BottomSheetContext value={{ open, close, unmount: () => setMounted(false) }}>{children}</BottomSheetContext>
      </GestureHandlerRootView>
    </Modal>
  );
}

type BottomSheetContentProps = {
  /** `fit` grows with its content up to 90% of the screen; `tall` always takes 90%, for lists and chats that fill the space. */
  size?: 'fit' | 'tall';
  children: ReactNode;
};

export function BottomSheetContent({ size = 'fit', children }: BottomSheetContentProps) {
  const { colors, elevation } = useTheme();
  const { open, close, unmount } = useBottomSheet();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(height);
  const maxHeight = height * 0.9 - insets.top;

  useEffect(() => {
    if (open) {
      translateY.set(withTiming(0, { duration: reducedMotion ? 0 : OPEN_DURATION, easing: EASE_OUT }));
      return;
    }

    Keyboard.dismiss();
    translateY.set(
      withTiming(height, { duration: reducedMotion ? 0 : CLOSE_DURATION, easing: EASE_OUT }, (finished) => {
        if (finished) scheduleOnRN(unmount);
      })
    );
  }, [open, height, reducedMotion, translateY, unmount]);

  const drag = usePanGesture({
    activeOffsetY: 8,
    onUpdate: (event) => {
      'worklet';
      translateY.set(Math.max(0, event.translationY));
    },
    onDeactivate: (event) => {
      'worklet';
      if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(close);
        return;
      }

      translateY.set(withSpring(0, { damping: 28, stiffness: 320 }));
    }
  });

  return (
    <>
      <Scrim translateY={translateY} distance={height} onPress={close} />
      <View pointerEvents="box-none" style={styles.anchor}>
        <BottomSheetDragContext value={drag}>
          <SheetSurface translateY={translateY}>
            <View
              accessibilityViewIsModal
              style={[
                styles.sheet,
                elevation.floating,
                {
                  maxHeight,
                  height: size === 'tall' ? maxHeight : undefined,
                  backgroundColor: colors.background,
                  borderColor: colors.border
                }
              ]}
            >
              {children}
            </View>
          </SheetSurface>
        </BottomSheetDragContext>
      </View>
    </>
  );
}

function Scrim({
  translateY,
  distance,
  onPress
}: {
  translateY: SharedValue<number>;
  distance: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const t = useTranslations(commonCatalog);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: interpolate(translateY.get(), [0, distance], [1, 0]) }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, animatedStyle]}>
      <Pressable accessibilityLabel={t('dismiss')} onPress={onPress} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

function SheetSurface({ translateY, children }: { translateY: SharedValue<number>; children: ReactNode }) {
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.get() }] }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

export function BottomSheetHeader({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const drag = use(BottomSheetDragContext);

  const header = (
    <View style={styles.header}>
      <View style={[styles.grabber, { backgroundColor: colors.borderStrong }]} />
      <View style={styles.headerRow}>{children}</View>
    </View>
  );

  return drag ? <GestureDetector gesture={drag}>{header}</GestureDetector> : header;
}

export function BottomSheetHeading({ children }: { children: ReactNode }) {
  return <View style={styles.heading}>{children}</View>;
}

export function BottomSheetTitle({ children }: { children: ReactNode }) {
  return (
    <Text variant="heading" accessibilityRole="header" numberOfLines={1}>
      {children}
    </Text>
  );
}

export function BottomSheetDescription({ children }: { children: ReactNode }) {
  return (
    <Text variant="caption" tone="muted" numberOfLines={2}>
      {children}
    </Text>
  );
}

export function BottomSheetClose() {
  const t = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const { close } = useBottomSheet();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('close')}
      hitSlop={HIT_SLOP}
      onPress={close}
      style={({ pressed }) => [styles.close, { backgroundColor: pressed ? colors.sandStrong : colors.sand }]}
    >
      <Icon icon={X} size={17} tone="muted" />
    </Pressable>
  );
}

export function BottomSheetScrollView({ contentContainerStyle, ...props }: ScrollViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      {...props}
      contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + SPACING.lg }, contentContainerStyle]}
    />
  );
}

export function BottomSheetBody({ children }: { children: ReactNode }) {
  return <View style={styles.fill}>{children}</View>;
}

/** Closes the sheet from inside a custom part, for example after an action that leaves the sheet. */
export function useBottomSheetClose() {
  return useBottomSheet().close;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  anchor: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  header: { paddingTop: SPACING.xs, paddingBottom: SPACING.sm, paddingHorizontal: GUTTER },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: RADII.pill, marginBottom: SPACING.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  heading: { flex: 1, gap: 1 },
  close: { width: 30, height: 30, borderRadius: RADII.pill, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: GUTTER, gap: SPACING.xs },
  fill: { flex: 1 }
});
