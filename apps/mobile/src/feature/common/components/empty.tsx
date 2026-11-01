import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

import { Icon } from './icon';
import { Text } from './text';

export function Empty({ children }: { children: ReactNode }) {
  return <View style={styles.empty}>{children}</View>;
}

export function EmptyMedia({ icon }: { icon: LucideIcon }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.media, { backgroundColor: colors.sand, borderColor: colors.border }]}>
      <Icon icon={icon} size={22} tone="ink" />
    </View>
  );
}

export function EmptyTitle({ children }: { children: ReactNode }) {
  return (
    <Text variant="heading" style={styles.centered}>
      {children}
    </Text>
  );
}

export function EmptyDescription({ children }: { children: ReactNode }) {
  return (
    <Text variant="caption" tone="muted" style={styles.centered}>
      {children}
    </Text>
  );
}

export function EmptyContent({ children }: { children: ReactNode }) {
  return <View style={styles.content}>{children}</View>;
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: SPACING.xs, paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.xl },
  media: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADII.md,
    borderCurve: 'continuous',
    marginBottom: SPACING.xxs
  },
  centered: { textAlign: 'center', maxWidth: 300 },
  content: { marginTop: SPACING.sm, alignSelf: 'stretch', alignItems: 'center' }
});
