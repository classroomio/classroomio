import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';

export function LearningStats({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const stats = Children.toArray(children).filter(isValidElement);

  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      {stats.map((stat, index) => (
        <Fragment key={stat.key ?? index}>
          {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          {stat}
        </Fragment>
      ))}
    </View>
  );
}

type LearningStatProps = { label: string; value: number | undefined };

export function LearningStat({ label, value }: LearningStatProps) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={value === undefined ? label : `${value} ${label}`}>
      {value === undefined ? (
        <Skeleton width={28} height={26} />
      ) : (
        <Text variant="title" style={styles.value}>
          {value}
        </Text>
      )}
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    paddingVertical: SPACING.sm
  },
  divider: { width: StyleSheet.hairlineWidth * 2, marginVertical: SPACING.xxs },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: SPACING.xs },
  value: { fontVariant: ['tabular-nums'] }
});
