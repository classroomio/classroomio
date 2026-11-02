import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function CourseSummary({ children }: { children: ReactNode }) {
  return <View style={styles.summary}>{children}</View>;
}

type CourseSummaryProgressProps = { percent: number; label: string; detail?: string; finished?: boolean };

export function CourseSummaryProgress({ percent, label, detail, finished = false }: CourseSummaryProgressProps) {
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
      <View style={styles.headline}>
        <Text variant="title" style={styles.percent}>
          {percentLabel}
        </Text>
        <Text variant="captionStrong" tone="muted" style={styles.label}>
          {label}
        </Text>
      </View>
      <Progress value={rounded} />
      {detail ? (
        <View style={styles.detail}>
          {finished ? <Icon icon={CheckCircleIcon} size={16} tone="success" weight="fill" /> : null}
          <Text variant="caption" tone={finished ? 'success' : 'muted'} numberOfLines={2} style={styles.detailText}>
            {detail}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { gap: SPACING.md },
  progress: { gap: SPACING.xs },
  headline: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.xs },
  percent: { fontVariant: ['tabular-nums'] },
  label: { flex: 1 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs + 2 },
  detailText: { flex: 1 }
});
