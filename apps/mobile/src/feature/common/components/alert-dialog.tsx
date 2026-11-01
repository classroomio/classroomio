import { createContext, use, useEffect, type ReactNode } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

import { RADII, SPACING } from '@/feature/common/constants/layout';
import { EASE_OUT } from '@/feature/common/constants/motion';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { Button, ButtonSpinner, ButtonText, type ButtonVariant } from './button';
import { Text } from './text';

const contentEntering = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.96 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT }
}).duration(200);

const AlertDialogContext = createContext<{ close: () => void; busy: boolean }>({ close: () => {}, busy: false });

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
  const close = () => onOpenChange(false);

  useEffect(() => {
    if (open) Keyboard.dismiss();
  }, [open]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={busy ? undefined : close}
    >
      <AlertDialogContext value={{ close, busy }}>
        <Pressable
          accessibilityLabel={t('dismiss')}
          onPress={busy ? undefined : close}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
        />
        <View pointerEvents="box-none" style={styles.center}>
          {children}
        </View>
      </AlertDialogContext>
    </Modal>
  );
}

export function AlertDialogContent({ children }: { children: ReactNode }) {
  const { colors, elevation } = useTheme();
  const { width } = useWindowDimensions();

  return (
    <Animated.View
      entering={contentEntering}
      accessibilityViewIsModal
      style={[
        styles.content,
        elevation.floating,
        { width: Math.min(360, width - SPACING.xl * 2), backgroundColor: colors.surface, borderColor: colors.border }
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
