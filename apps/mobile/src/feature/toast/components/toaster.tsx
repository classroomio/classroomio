import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

import { Icon } from '@/feature/common/components/icon';
import { Text, type TextTone } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { EASE_OUT } from '@/feature/common/constants/motion';
import { errorHaptic, selectionHaptic, successHaptic, warningHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { dismissToast, useToast } from '@/feature/toast/helpers/toast-store';
import type { ToastMessage, ToastTone } from '@/feature/toast/types/toast';

const toastEntering = FadeInUp.duration(240)
  .easing(EASE_OUT)
  .withInitialValues({ opacity: 0, transform: [{ translateY: -12 }] });
const toastExiting = FadeOutUp.duration(160).easing(EASE_OUT);

const TONES: Record<ToastTone, { icon: LucideIcon; tone: TextTone; haptic: () => void }> = {
  success: { icon: CircleCheck, tone: 'success', haptic: successHaptic },
  info: { icon: Info, tone: 'primary', haptic: selectionHaptic },
  warning: { icon: TriangleAlert, tone: 'warning', haptic: warningHaptic },
  danger: { icon: CircleAlert, tone: 'danger', haptic: errorHaptic }
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
      <View pointerEvents="box-none" style={[styles.stage, { top: insets.top + SPACING.xs }]}>
        {toast && <ToastCard key={toast.id} toast={toast} />}
      </View>
    </Overlay>
  );
}

function ToastCard({ toast }: { toast: ToastMessage }) {
  const { colors, elevation } = useTheme();
  const tone = TONES[toast.tone];

  useEffect(() => {
    tone.haptic();
    AccessibilityInfo.announceForAccessibility([toast.title, toast.description].filter(Boolean).join('. '));
    const timer = setTimeout(() => dismissToast(toast.id), toast.duration);

    return () => clearTimeout(timer);
  }, [toast, tone]);

  return (
    <Animated.View entering={toastEntering} exiting={toastExiting}>
      <Pressable
        accessibilityRole="alert"
        onPress={() => dismissToast(toast.id)}
        style={[styles.card, elevation.floating, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Icon icon={tone.icon} size={20} tone={tone.tone} />
        <View style={styles.copy}>
          <Text variant="captionStrong">{toast.title}</Text>
          {toast.description ? (
            <Text variant="caption" tone="muted">
              {toast.description}
            </Text>
          ) : null}
        </View>
      </Pressable>
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
  copy: { flex: 1, gap: 1 }
});
