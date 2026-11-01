import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

export function StatGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export type StatTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

type StatProps = { label: string; value: string; icon: AppIcon; tone?: StatTone; detail?: string };

/** A figure on a surface tile, marked with a filled glyph on a tinted badge like the profile stats. */
export function Stat({ label, value, icon, tone = 'neutral', detail }: StatProps) {
  const { colors } = useTheme();
  const tint = {
    primary: colors.primaryTint,
    success: colors.successTint,
    warning: colors.warningTint,
    danger: colors.dangerTint,
    neutral: colors.muted
  }[tone];
  const glyph = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    neutral: colors.inkMuted
  }[tone];

  return (
    <View
      accessible
      accessibilityLabel={[`${label}: ${value}`, detail].filter(Boolean).join(', ')}
      style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.badge, { backgroundColor: tint }]}>
        <Icon icon={icon} size={19} color={glyph} weight="fill" />
      </View>
      <Text variant="title" style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </Text>
      {detail ? (
        <Text variant="micro" tone="subtle" numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: SPACING.xs },
  stat: {
    flex: 1,
    gap: 2,
    padding: SPACING.sm,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.xl,
    borderCurve: 'continuous'
  },
  badge: {
    width: 34,
    height: 34,
    marginBottom: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    borderCurve: 'continuous'
  },
  value: { fontVariant: ['tabular-nums'] }
});
