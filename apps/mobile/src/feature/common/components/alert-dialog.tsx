import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  makeMutable,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { RADII, SPACING } from '@/feature/common/constants/layout';
import { EASE_OUT } from '@/feature/common/constants/motion';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { Button, ButtonSpinner, ButtonText, type ButtonVariant } from './button';
import { Text } from './text';

const ENTER_DURATION = 200;
const EXIT_DURATION = 150;

type AlertDialogContextValue = {
  close: () => void;
  busy: boolean;
  progress: SharedValue<number>;
  reducedMotion: boolean;
};

const AlertDialogContext = createContext<AlertDialogContextValue>({
  close: () => {},
  busy: false,
  progress: makeMutable(1),
  reducedMotion: false
});

type AlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Blocks dismissal and disables actions while a confirmed action is running. */
  busy?: boolean;
  children: ReactNode;
};

export function AlertDialog({ open, onOpenChange, busy = false, children }: AlertDialogProps) {
  const { colors } = useTheme();
  const t = useTranslations(commonCatalog);
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  const close = () => onOpenChange(false);

  useEffect(() => {
    if (open) {
      Keyboard.dismiss();
      progress.set(withTiming(1, { duration: ENTER_DURATION, easing: EASE_OUT, reduceMotion: ReduceMotion.Never }));
      return;
    }

    progress.set(
      withTiming(0, { duration: EXIT_DURATION, easing: EASE_OUT, reduceMotion: ReduceMotion.Never }, (finished) => {
        if (finished) scheduleOnRN(setMounted, false);
      })
    );
  }, [open, progress]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={busy ? undefined : close}
    >
      <AlertDialogContext value={{ close, busy, progress, reducedMotion }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, scrimStyle]}>
          <Pressable
            accessibilityLabel={t('dismiss')}
            onPress={busy ? undefined : close}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View pointerEvents={open ? 'box-none' : 'none'} style={styles.center}>
          {children}
        </View>
      </AlertDialogContext>
    </Modal>
  );
}

export function AlertDialogContent({ children }: { children: ReactNode }) {
  const { colors, elevation } = useTheme();
  const { width } = useWindowDimensions();
  const { progress, reducedMotion } = use(AlertDialogContext);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: reducedMotion ? 1 : interpolate(progress.get(), [0, 1], [0.96, 1]) }]
  }));

  return (
    <Animated.View
      accessibilityViewIsModal
      style={[
        styles.content,
        elevation.floating,
        { width: Math.min(360, width - SPACING.xl * 2), backgroundColor: colors.surface, borderColor: colors.border },
        animatedStyle
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function AlertDialogTitle({ children }: { children: ReactNode }) {
  return (
    <Text variant="heading" accessibilityRole="header">
      {children}
    </Text>
  );
}

export function AlertDialogDescription({ children }: { children: ReactNode }) {
  return (
    <Text variant="caption" tone="muted" style={styles.description}>
      {children}
    </Text>
  );
}

export function AlertDialogFooter({ children }: { children: ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

type AlertDialogActionProps = {
  variant?: Extract<ButtonVariant, 'primary' | 'destructive'>;
  loading?: boolean;
  onPress: () => void;
  children: string;
};

export function AlertDialogAction({ variant = 'primary', loading = false, onPress, children }: AlertDialogActionProps) {
  const { busy } = use(AlertDialogContext);

  return (
    <Button variant={variant} disabled={busy} onPress={onPress} style={styles.action}>
      {loading ? <ButtonSpinner /> : <ButtonText>{children}</ButtonText>}
    </Button>
  );
}

export function AlertDialogCancel({ children }: { children?: string }) {
  const t = useTranslations(commonCatalog);
  const { close, busy } = use(AlertDialogContext);

  return (
    <Button variant="outline" disabled={busy} onPress={close} style={styles.action}>
      <ButtonText>{children ?? t('cancel')}</ButtonText>
    </Button>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: SPACING.lg,
    borderWidth: 1,
    borderRadius: RADII.sheet,
    borderCurve: 'continuous'
  },
  description: { marginTop: SPACING.xxs + 2 },
  footer: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.lg },
  action: { flex: 1 }
});
