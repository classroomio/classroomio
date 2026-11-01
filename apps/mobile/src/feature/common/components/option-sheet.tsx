import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { createContext, use, useRef, type ReactNode, type Ref } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RADII, SPACING } from '@/feature/common/constants/layout';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { Sheet, useSheetDismiss, type SheetRef } from './bottom-sheet';
import { Icon, type AppIcon } from './icon';
import { Text } from './text';

const OptionSheetSelectContext = createContext<((action: () => void) => void) | null>(null);

function useOptionSelect() {
  const select = use(OptionSheetSelectContext);
  if (!select) throw new Error('OptionSheet parts must be used inside OptionSheet');

  return select;
}

type OptionSheetProps = {
  ref?: Ref<SheetRef>;
  /** Runs once the sheet has closed, after any chosen action. */
  onDismiss?: () => void;
  children: ReactNode;
};

/**
 * A list of actions in a gorhom sheet. Present it through its ref. Choosing an action closes the sheet first and runs
 * the action once it has closed, so a dialog or screen it opens doesn't collide with the sheet.
 */
export function OptionSheet({ ref, onDismiss, children }: OptionSheetProps) {
  const pending = useRef<(() => void) | null>(null);

  return (
    <Sheet
      ref={ref}
      onDismiss={() => {
        const action = pending.current;
        pending.current = null;
        action?.();
        onDismiss?.();
      }}
    >
      <OptionSheetSelector pending={pending}>{children}</OptionSheetSelector>
    </Sheet>
  );
}

function OptionSheetSelector({
  pending,
  children
}: {
  pending: React.RefObject<(() => void) | null>;
  children: ReactNode;
}) {
  const dismiss = useSheetDismiss();

  const select = (action: () => void) => {
    pending.current = action;
    dismiss();
  };

  return (
    <OptionSheetSelectContext value={select}>
      <View style={styles.list}>{children}</View>
    </OptionSheetSelectContext>
  );
}

export function OptionSheetTitle({ children }: { children: ReactNode }) {
  return (
    <Text variant="captionStrong" tone="muted" accessibilityRole="header" numberOfLines={2} style={styles.title}>
      {children}
    </Text>
  );
}

type OptionSheetItemProps = {
  onSelect: () => void;
  icon?: AppIcon;
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
  const select = useOptionSelect();
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
      style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.muted }, disabled && styles.disabled]}
    >
      {icon ? <Icon icon={icon} size={20} tone={tone} /> : null}
      <Text variant="body" tone={tone} numberOfLines={2} style={styles.label}>
        {children}
      </Text>
      {selected ? <Icon icon={CheckIcon} size={18} tone="primary" weight="bold" /> : null}
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
  const dismiss = useSheetDismiss();

  return (
    <View style={styles.cancelWrap}>
      <Pressable
        accessibilityRole="button"
        onPress={dismiss}
        style={({ pressed }) => [styles.cancel, { backgroundColor: pressed ? colors.mutedStrong : colors.muted }]}
      >
        <Text variant="label" tone="ink">
          {children ?? t('cancel')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {},
  title: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xs, textAlign: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 52,
    paddingHorizontal: SPACING.lg
  },
  label: { flex: 1 },
  separator: { height: StyleSheet.hairlineWidth, marginHorizontal: SPACING.lg, marginVertical: SPACING.xxs },
  cancelWrap: { paddingHorizontal: SPACING.md, paddingTop: SPACING.xs },
  cancel: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  disabled: { opacity: 0.4 }
});
