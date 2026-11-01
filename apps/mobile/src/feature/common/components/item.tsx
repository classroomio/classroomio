import { ChevronRight } from 'lucide-react-native';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { RADII, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { Icon } from './icon';
import { PressableScale } from './pressable-scale';
import { Text, type TextProps } from './text';

export function ItemGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors, elevation } = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View
      style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }, elevation.raised, style]}
    >
      {rows.map((row, index) => (
        <Fragment key={row.key ?? index}>
          {index > 0 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

type ItemProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function Item({ onPress, style, children, ...props }: ItemProps) {
  if (!onPress) return <View style={[styles.item, style]}>{children}</View>;

  return (
    <PressableScale
      accessibilityRole="button"
      scaleTo={0.985}
      onPress={(event) => {
        tapHaptic();
        onPress(event);
      }}
      {...props}
      style={[styles.item, style]}
    >
      {children}
    </PressableScale>
  );
}

export function ItemMedia({ children, variant = 'plain' }: { children: ReactNode; variant?: 'plain' | 'tile' }) {
  const { colors } = useTheme();

  return (
    <View style={variant === 'tile' ? [styles.tile, { backgroundColor: colors.sand }] : styles.media}>{children}</View>
  );
}

export function ItemContent({ children }: { children: ReactNode }) {
  return <View style={styles.content}>{children}</View>;
}

export function ItemTitle(props: TextProps) {
  return <Text variant="bodyStrong" numberOfLines={2} {...props} />;
}

export function ItemDescription(props: TextProps) {
  return <Text variant="caption" tone="muted" numberOfLines={2} {...props} />;
}

export function ItemActions({ children }: { children: ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

export function ItemChevron() {
  return <Icon icon={ChevronRight} size={18} tone="subtle" />;
}

const styles = StyleSheet.create({
  group: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.xl,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  separator: { height: StyleSheet.hairlineWidth * 2, marginLeft: SPACING.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm
  },
  media: { alignItems: 'center', justifyContent: 'center' },
  tile: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    borderCurve: 'continuous'
  },
  content: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }
});
