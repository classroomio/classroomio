import { createContext, use, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RADII } from '@/feature/common/constants/layout';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { Text } from './text';

type SegmentedControlContextValue = { value: string; onValueChange: (value: string) => void };

const SegmentedControlContext = createContext<SegmentedControlContextValue>({ value: '', onValueChange: () => {} });

type SegmentedControlProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  children: ReactNode;
};

export function SegmentedControl<T extends string>({ value, onValueChange, children }: SegmentedControlProps<T>) {
  const { colors } = useTheme();

  return (
    <SegmentedControlContext value={{ value, onValueChange: (next) => onValueChange(next as T) }}>
      <View accessibilityRole="tablist" style={[styles.track, { backgroundColor: colors.sandStrong }]}>
        {children}
      </View>
    </SegmentedControlContext>
  );
}

export function SegmentedControlItem({ value, children }: { value: string; children: string }) {
  const { colors, elevation } = useTheme();
  const context = use(SegmentedControlContext);
  const selected = context.value === value;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={() => {
        if (selected) return;

        selectionHaptic();
        context.onValueChange(value);
      }}
      style={[styles.segment, selected && [{ backgroundColor: colors.surface }, elevation.raised]]}
    >
      <Text variant="captionStrong" tone={selected ? 'ink' : 'muted'} numberOfLines={1}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 3, borderRadius: RADII.md, borderCurve: 'continuous' },
  segment: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.input - 1,
    borderCurve: 'continuous'
  }
});
