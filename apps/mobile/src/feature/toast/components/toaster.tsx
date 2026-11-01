import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type ExitAnimationsValues,
  type LayoutAnimation
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { Text, type TextTone } from '@/feature/common/components/text';
import { GUTTER, HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { EASE_OUT } from '@/feature/common/constants/motion';
import {
  errorHaptic,
  selectionHaptic,
  successHaptic,
  tapHaptic,
  warningHaptic
} from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { dismissToast, toastReplacing, useToast } from '@/feature/toast/helpers/toast-store';
import type { ToastMessage, ToastTone } from '@/feature/toast/types/toast';

const DISMISS_DISTANCE = 36;
const FLING_DISTANCE = 160;
const RESUME_AFTER_TOUCH_MS = 2000;

const toastEntering = FadeInUp.duration(240)
  .easing(EASE_OUT)
  .withInitialValues({ opacity: 0, transform: [{ translateY: -12 }] });

function toastExiting(_values: ExitAnimationsValues): LayoutAnimation {
  'worklet';
  const replacing = toastReplacing.get();
  const timing = { duration: replacing ? 140 : 180, easing: EASE_OUT };

  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
    animations: {
      opacity: withTiming(0, timing),
      transform: [
        { translateY: withTiming(replacing ? 0 : -10, timing) },
        { scale: withTiming(replacing ? 0.96 : 1, timing) }
      ]
    }
  };
}

function project(velocity: number) {
  'worklet';
  const deceleration = 0.998;

  return ((velocity / 1000) * deceleration) / (1 - deceleration);
}

function rubberband(overshoot: number, dimension: number) {
  'worklet';
  const constant = 0.55;

  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

const TONES: Record<ToastTone, { icon: AppIcon; tone: TextTone; haptic: () => void }> = {
  success: { icon: CheckCircleIcon, tone: 'success', haptic: successHaptic },
  info: { icon: InfoIcon, tone: 'primary', haptic: selectionHaptic },
  warning: { icon: WarningIcon, tone: 'warning', haptic: warningHaptic },
  danger: { icon: WarningCircleIcon, tone: 'danger', haptic: errorHaptic }
};

function Overlay({ children }: { children: ReactNode }) {
  if (Platform.OS === 'ios') return <FullWindowOverlay>{children}</FullWindowOverlay>;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {children}
    </View>
  );
}

export function Toaster() {
  const toast = useToast();
  const insets = useSafeAreaInsets();

  return (
    <Overlay>
      <GestureHandlerRootView pointerEvents="box-none" style={[styles.stage, { top: insets.top + SPACING.xs }]}>
        {toast && <ToastCard key={toast.id} toast={toast} />}
      </GestureHandlerRootView>
    </Overlay>
  );
}

function ToastCard({ toast }: { toast: ToastMessage }) {
  const { colors, elevation } = useTheme();
  const tone = TONES[toast.tone];
  const translateY = useSharedValue(0);
  const [touching, setTouching] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    tone.haptic();
    const announcement = [toast.title, toast.description, toast.action?.label].filter(Boolean).join('. ');
    AccessibilityInfo.announceForAccessibility(announcement);
  }, [toast, tone]);

  useEffect(() => {
    if (touching) return;

    const timer = setTimeout(() => dismissToast(toast.id), touched ? RESUME_AFTER_TOUCH_MS : toast.duration);

    return () => clearTimeout(timer);
  }, [toast, touching, touched]);

  const release = () => {
    setTouching(false);
    setTouched(true);
  };

  const swipe = usePanGesture({
    activeOffsetY: [-6, 6],
    onBegin: () => {
      'worklet';
      scheduleOnRN(setTouching, true);
    },
    onUpdate: (event) => {
      'worklet';
      const y = event.translationY;
      translateY.set(y <= 0 ? y : rubberband(y, 120));
    },
    onDeactivate: (event) => {
      'worklet';
      if (translateY.get() + project(event.velocityY) < -DISMISS_DISTANCE) {
        translateY.set(
          withSpring(
            -FLING_DISTANCE,
            { duration: 300, dampingRatio: 1, velocity: event.velocityY, overshootClamping: true },
            (finished) => {
              if (finished) scheduleOnRN(dismissToast, toast.id);
            }
          )
        );
        return;
      }

      translateY.set(withSpring(0, { duration: 400, dampingRatio: 0.8, velocity: event.velocityY }));
    },
    onFinalize: () => {
      'worklet';
      scheduleOnRN(release);
    }
  });

  const dragStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.get(), [-FLING_DISTANCE * 0.6, 0], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: translateY.get() }]
  }));

  const action = toast.action;

  return (
    <Animated.View entering={toastEntering} exiting={toastExiting}>
      <GestureDetector gesture={swipe}>
        <Animated.View style={dragStyle}>
          <Pressable
            accessible={!action}
            accessibilityRole="alert"
            onPress={() => dismissToast(toast.id)}
            style={[styles.card, elevation.floating, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Icon icon={tone.icon} size={20} tone={tone.tone} />
            <View accessible={Boolean(action)} accessibilityRole="alert" style={styles.copy}>
              <Text variant="captionStrong">{toast.title}</Text>
              {toast.description ? (
                <Text variant="caption" tone="muted">
                  {toast.description}
                </Text>
              ) : null}
            </View>
            {action ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={action.label}
                hitSlop={HIT_SLOP}
                onPress={() => {
                  tapHaptic();
                  action.onPress();
                  dismissToast(toast.id);
                }}
                style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.muted }]}
              >
                <Text variant="captionStrong" tone="primary" numberOfLines={1}>
                  {action.label}
                </Text>
              </Pressable>
            ) : null}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: { position: 'absolute', left: GUTTER, right: GUTTER },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderWidth: 1,
    borderRadius: RADII.xl,
    borderCurve: 'continuous'
  },
  copy: { flex: 1, gap: 1 },
  action: {
    alignSelf: 'center',
    marginVertical: -SPACING.xxs,
    marginRight: -SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs + 2,
    borderRadius: RADII.input,
    borderCurve: 'continuous'
  }
});
