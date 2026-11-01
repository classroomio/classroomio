import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { Text, type TextTone } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

export function StatGrid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

type StatProps = { label: string; value: string; icon?: AppIcon; tone?: TextTone; detail?: string };

export function Stat({ label, value, icon, tone = 'ink', detail }: StatProps) {
  const { colors, elevation } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={[`${label}: ${value}`, detail].filter(Boolean).join(', ')}
      style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }, elevation.raised]}
    >
      <View style={styles.labelRow}>
        {icon ? <Icon icon={icon} size={14} tone={tone === 'ink' ? 'muted' : tone} /> : null}
        <Text variant="micro" tone="muted" numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text variant="title" tone={tone} style={styles.value}>
        {value}
      </Text>
      {detail ? (
        <Text variant="micro" tone="muted" numberOfLines={1}>
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
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  value: { fontVariant: ['tabular-nums'] }
});
