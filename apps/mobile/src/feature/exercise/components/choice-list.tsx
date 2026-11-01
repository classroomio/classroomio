import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { createContext, use, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { DURATION } from '@/feature/common/constants/motion';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';

type ChoiceMode = 'single' | 'multiple';

type Direction = 'column' | 'row';

const ChoiceListContext = createContext<{ mode: ChoiceMode; disabled: boolean; direction: Direction }>({
  mode: 'single',
  disabled: false,
  direction: 'column'
});
const ChoiceItemContext = createContext<{ selected: boolean }>({ selected: false });

type ChoiceListProps = { mode?: ChoiceMode; disabled?: boolean; direction?: Direction; children: ReactNode };

export function ChoiceList({ mode = 'single', disabled = false, direction = 'column', children }: ChoiceListProps) {
  return (
    <ChoiceListContext value={{ mode, disabled, direction }}>
      <View
        accessibilityRole={mode === 'single' ? 'radiogroup' : 'list'}
        style={[styles.list, direction === 'row' && styles.row]}
      >
        {children}
      </View>
    </ChoiceListContext>
  );
}

type ChoiceItemProps = { selected: boolean; onPress: () => void; accessibilityLabel?: string; children: ReactNode };

export function ChoiceItem({ selected, onPress, accessibilityLabel, children }: ChoiceItemProps) {
  const { colors, elevation } = useTheme();
  const { mode, disabled, direction } = use(ChoiceListContext);

  return (
    <ChoiceItemContext value={{ selected }}>
      <PressableScale
        accessibilityRole={mode === 'single' ? 'radio' : 'checkbox'}
        accessibilityState={{ checked: selected, disabled }}
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        scaleTo={0.985}
        onPress={() => {
          selectionHaptic();
          onPress();
        }}
        style={direction === 'row' ? styles.rowItem : undefined}
      >
        <Animated.View
          style={[
            styles.item,
            elevation.raised,
            {
              backgroundColor: selected ? colors.primaryTint : colors.surface,
              borderColor: selected ? colors.primary : colors.border,
              transitionProperty: ['backgroundColor', 'borderColor'],
              transitionDuration: DURATION.fast
            }
          ]}
        >
          {children}
        </Animated.View>
      </PressableScale>
    </ChoiceItemContext>
  );
}

export function ChoiceIndicator() {
  const { colors } = useTheme();
  const { mode } = use(ChoiceListContext);
  const { selected } = use(ChoiceItemContext);

  return (
    <Animated.View
      style={[
        styles.indicator,
        mode === 'single' ? styles.radio : styles.checkbox,
        {
          borderColor: selected ? colors.primary : colors.borderStrong,
          backgroundColor: selected ? colors.primary : colors.surface,
          transitionProperty: ['backgroundColor', 'borderColor'],
          transitionDuration: DURATION.fast
        }
      ]}
    >
      {selected && <Icon icon={CheckIcon} size={14} color={colors.onPrimary} weight="bold" />}
    </Animated.View>
  );
}

export function ChoiceIcon({ icon }: { icon: AppIcon }) {
  const { selected } = use(ChoiceItemContext);

  return <Icon icon={icon} size={22} tone={selected ? 'primary' : 'muted'} />;
}

export function ChoiceLabel({ children }: { children: ReactNode }) {
  return (
    <Text variant="body" style={styles.label}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACING.xs },
  row: { flexDirection: 'row' },
  rowItem: { flex: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  indicator: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  radio: { borderRadius: 11 },
  checkbox: { borderRadius: RADII.xs + 1, borderCurve: 'continuous' },
  label: { flex: 1 }
});
