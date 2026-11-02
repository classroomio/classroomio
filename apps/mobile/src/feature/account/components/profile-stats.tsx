import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { selectionHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';

export function ProfileStats({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

type StatTone = 'primary' | 'success' | 'warning';

type ProfileStatProps = {
  icon: AppIcon;
  tone: StatTone;
  label: string;
  value: number | undefined;
  onPress: () => void;
};

export function ProfileStat({ icon, tone, label, value, onPress }: ProfileStatProps) {
  const { colors } = useTheme();
  const tint = { primary: colors.primaryTint, success: colors.successTint, warning: colors.warningTint }[tone];
  const glyph = { primary: colors.primary, success: colors.success, warning: colors.warning }[tone];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={value === undefined ? label : `${value} ${label}`}
      onPress={() => {
        selectionHaptic();
        onPress();
      }}
      style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.badge, { backgroundColor: tint }]}>
        <Icon icon={icon} size={19} color={glyph} weight="fill" />
      </View>
      {value === undefined ? (
        <Skeleton width={32} height={28} />
      ) : (
        <Text variant="title" style={styles.value}>
          {value}
        </Text>
      )}
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACING.xs },
  tile: {
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
