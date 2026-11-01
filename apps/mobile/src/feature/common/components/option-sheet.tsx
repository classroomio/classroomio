import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Check, type LucideIcon } from 'lucide-react-native';
import { createContext, use, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RADII, SPACING } from '@/feature/common/constants/layout';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useModalPresentation } from '@/feature/common/helpers/use-modal-presentation';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { SheetBackdrop, SheetContainer } from './bottom-sheet';
import { Icon } from './icon';
import { Text } from './text';

type OptionSheetContextValue = {
  open: boolean;
  close: () => void;
  /** Closes the sheet and runs `action` once it has finished dismissing, so a dialog it opens doesn't collide. */
  select: (action: () => void) => void;
  runPending: () => void;
};

const OptionSheetContext = createContext<OptionSheetContextValue | null>(null);

function useOptionSheet() {
  const context = use(OptionSheetContext);
  if (!context) throw new Error('OptionSheet parts must be used inside OptionSheet');

  return context;
}

type OptionSheetProps = { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode };

/** A list of actions in a gorhom bottom sheet; choosing one closes the sheet before the action runs. */
export function OptionSheet({ open, onOpenChange, children }: OptionSheetProps) {
  const pending = useRef<(() => void) | null>(null);
  const close = () => onOpenChange(false);

  const select = (action: () => void) => {
    pending.current = action;
    close();
  };

  const runPending = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  return <OptionSheetContext value={{ open, close, select, runPending }}>{children}</OptionSheetContext>;
}

export function OptionSheetContent({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const context = useOptionSheet();
  const { open, close, runPending } = context;
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { modal, markDismissed } = useModalPresentation(open);

  return (
    <BottomSheetModal
      ref={modal}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.7}
      enablePanDownToClose
      onDismiss={() => {
        markDismissed();
        close();
        runPending();
      }}
      backdropComponent={SheetBackdrop}
      containerComponent={SheetContainer}
      backgroundStyle={[styles.background, { backgroundColor: colors.surface, borderColor: colors.border }]}
      handleIndicatorStyle={[styles.indicator, { backgroundColor: colors.borderStrong }]}
      accessibilityViewIsModal
    >
      <OptionSheetContext value={context}>
        <BottomSheetScrollView bounces={false} contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xs }}>
          {children}
        </BottomSheetScrollView>
      </OptionSheetContext>
    </BottomSheetModal>
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
  const { select } = useOptionSheet();
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
  const { close } = useOptionSheet();

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
  background: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    borderCurve: 'continuous'
  },
  indicator: { width: 36, height: 5, borderRadius: RADII.pill },
  title: { paddingHorizontal: SPACING.md, paddingTop: SPACING.xxs, paddingBottom: SPACING.xxs },
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
