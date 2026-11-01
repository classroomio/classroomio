import { ArrowRight, CircleCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Icon } from '@/feature/common/components/icon';
import { NotchCard } from '@/feature/common/components/notch-card';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { elapsedCopy, OLDEST_WAITED_KEYS } from '@/feature/teach/helpers/relative-time';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { GradingQueueItem } from '@/feature/teach/types/teach';

type GradingSummaryCardProps = { queue: GradingQueueItem[]; onOpen: () => void };

export function GradingSummaryCard({ queue, onOpen }: GradingSummaryCardProps) {
  const t = useTranslations(teachCatalog);
  const oldest = queue[0];
  const courseCount = new Set(queue.map((item) => item.courseId)).size;
  const lateCount = queue.filter((item) => item.isLate).length;

  if (!oldest) {
    return (
      <NotchCard style={styles.card}>
        <View style={styles.row}>
          <Icon icon={CircleCheck} size={22} tone="success" />
          <View style={styles.copy}>
            <Text variant="heading">{t('allGradedTitle')}</Text>
            <Text variant="caption" tone="muted">
              {t('allGradedDescription')}
            </Text>
          </View>
        </View>
      </NotchCard>
    );
  }

  const details = [
    t('summaryCourses', { count: courseCount }),
    lateCount > 0 ? t('summaryLate', { count: lateCount }) : null
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <NotchCard style={styles.card}>
      <View style={styles.figure} accessible accessibilityLabel={t('summaryA11y', { count: queue.length, details })}>
        <Text variant="display" style={styles.count}>
          {queue.length}
        </Text>
        <View style={styles.copy}>
          <Text variant="subheading">{t('summaryLabel', { count: queue.length })}</Text>
          <Text variant="caption" tone="muted">
            {details}
          </Text>
        </View>
      </View>
      <Text variant="caption" tone="body">
        {elapsedCopy(t, OLDEST_WAITED_KEYS, oldest.submittedAt)}
      </Text>
      <Button onPress={onOpen}>
        <ButtonText>{t('startGrading')}</ButtonText>
        <ButtonIcon icon={ArrowRight} />
      </Button>
    </NotchCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  figure: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  count: { fontVariant: ['tabular-nums'], minWidth: 36 },
  copy: { flex: 1, gap: 2 }
});
