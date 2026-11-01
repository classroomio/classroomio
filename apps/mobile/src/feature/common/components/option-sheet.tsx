import { Check, type LucideIcon } from 'lucide-react-native';
import { createContext, use, useRef, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { EASE_OUT } from '@/feature/common/constants/motion';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { Icon } from './icon';
import { Text } from './text';

const sheetEntering = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 24 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: EASE_OUT }
}).duration(220);

const OptionSheetContext = createContext<{ close: () => void; select: (action: () => void) => void }>({
  close: () => {},
  select: () => {}
});

type OptionSheetProps = { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode };

export function OptionSheet({ open, onOpenChange, children }: OptionSheetProps) {
  const t = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const pending = useRef<(() => void) | null>(null);
  const close = () => onOpenChange(false);

  const runPending = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  const select = (action: () => void) => {
    close();
    // iOS cannot present another modal (such as a confirmation) until this one has finished dismissing.
    if (Platform.OS === 'ios') pending.current = action;
    else action();
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
      onDismiss={runPending}
    >
      <OptionSheetContext value={{ close, select }}>
        <Pressable
          accessibilityLabel={t('dismiss')}
          onPress={close}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
        />
        <View pointerEvents="box-none" style={styles.bottom}>
          {children}
        </View>
      </OptionSheetContext>
    </Modal>
  );
}

export function OptionSheetContent({ children }: { children: ReactNode }) {
  const { colors, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Animated.View
      entering={sheetEntering}
      accessibilityViewIsModal
      style={[
        styles.content,
        elevation.floating,
        {
          maxHeight: height * 0.7,
          marginBottom: insets.bottom + SPACING.xs,
          backgroundColor: colors.surface,
          borderColor: colors.border
        }
      ]}
    >
      <ScrollView bounces={false} contentContainerStyle={styles.scroll}>
        {children}
      </ScrollView>
    </Animated.View>
  );
}

export function OptionSheetTitle({ children }: { children: ReactNode }) {
  return (
    <Text variant="captionStrong" tone="muted" accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}

type OptionSheetItemProps = {
  onSelect: () => void;
  icon?: LucideIcon;
  selected?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  children: string;
};

export function OptionSheetItem({
  onSelect,
  icon,
  selected = false,
  destructive = false,
  disabled = false,
  children
}: OptionSheetItemProps) {
  const { colors } = useTheme();
  const { select } = use(OptionSheetContext);
  const tone = destructive ? 'danger' : 'ink';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        selectionHaptic();
        select(onSelect);
      }}
      style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.sand }, disabled && styles.disabled]}
    >
      {icon ? <Icon icon={icon} size={19} tone={tone} /> : null}
      <Text variant="bodyStrong" tone={tone} numberOfLines={2} style={styles.label}>
        {children}
      </Text>
      {selected ? <Icon icon={Check} size={18} tone="primary" /> : null}
    </Pressable>
  );
}

export function OptionSheetSeparator() {
  const { colors } = useTheme();

  return <View style={[styles.separator, { backgroundColor: colors.border }]} />;
}

export function OptionSheetCancel({ children }: { children?: string }) {
  const t = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const { close } = use(OptionSheetContext);

  return (
    <>
      <View style={[styles.separator, { backgroundColor: colors.border }]} />
      <Pressable
        accessibilityRole="button"
        onPress={close}
        style={({ pressed }) => [styles.item, styles.cancel, pressed && { backgroundColor: colors.sand }]}
      >
        <Text variant="label" tone="muted">
          {children ?? t('cancel')}
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  bottom: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: GUTTER - SPACING.xs },
  content: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.sheet,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  scroll: { paddingVertical: SPACING.xxs },
  title: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xxs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 50,
    paddingHorizontal: SPACING.md
  },
  label: { flex: 1 },
  cancel: { justifyContent: 'center' },
  separator: { height: StyleSheet.hairlineWidth * 2, marginVertical: SPACING.xxs },
  disabled: { opacity: 0.45 }
});
