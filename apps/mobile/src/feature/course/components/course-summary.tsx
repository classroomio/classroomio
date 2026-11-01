import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/feature/common/components/card';
import { ProgressRing } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function CourseSummary({ children }: { children: ReactNode }) {
  return <Card style={styles.card}>{children}</Card>;
}

type CourseSummaryProgressProps = { percent: number; label: string; detail?: string };

export function CourseSummaryProgress({ percent, label, detail }: CourseSummaryProgressProps) {
  const t = useTranslations(courseCatalog);
  const format = useFormatters();
  const rounded = Math.round(percent);
  const percentLabel = format.percent(rounded);

  return (
    <View
      style={styles.progress}
      accessible
      accessibilityLabel={[t('percentComplete', { percent: percentLabel }), label, detail].filter(Boolean).join(', ')}
    >
      <View style={styles.ring}>
        <ProgressRing value={rounded} size={48} strokeWidth={4} />
        <Text variant="micro" style={styles.ringLabel}>
          {percentLabel}
        </Text>
      </View>
      <View style={styles.copy}>
        <Text variant="bodyStrong">{label}</Text>
        {detail ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function CourseSummaryActions({ children }: { children: ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { padding: SPACING.md, gap: SPACING.md },
  progress: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringLabel: { position: 'absolute', fontSize: 11, letterSpacing: -0.2 },
  copy: { flex: 1, gap: 2 },
  actions: { gap: SPACING.xs }
});
