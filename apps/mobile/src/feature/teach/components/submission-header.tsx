import { CalendarDotsIcon } from 'phosphor-react-native/src/icons/CalendarDots';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/feature/common/components/avatar';
import { Banner, BannerContent, BannerDescription, BannerIcon, BannerTitle } from '@/feature/common/components/banner';
import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { elapsedCopy, formatDateTime, WAITING_KEYS } from '@/feature/teach/helpers/relative-time';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { GradingSubmission } from '@/feature/teach/types/teach';

export function SubmissionHeader({ submission }: { submission: GradingSubmission }) {
  const t = useTranslations(teachCatalog);
  const locale = useLocale();
  const learner = submission.student?.fullname || t('formerLearner');
  const graded = submission.gradingState === 'completed';

  return (
    <View style={styles.root}>
      <View style={styles.identity}>
        <Avatar name={learner} uri={submission.student?.avatarUrl} size={48} />
        <View style={styles.copy}>
          <Text variant="title" numberOfLines={2}>
            {learner}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {submission.exerciseTitle} · {submission.courseTitle}
          </Text>
        </View>
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Icon icon={CalendarDotsIcon} size={14} tone="subtle" />
          <Text variant="caption" tone="muted">
            {t('submittedAt', { date: formatDateTime(submission.submittedAt, locale) })}
          </Text>
        </View>
        {!graded && (
          <View style={styles.metaItem}>
            <Icon icon={ClockIcon} size={14} tone="subtle" />
            <Text variant="caption" tone="muted">
              {elapsedCopy(t, WAITING_KEYS, submission.submittedAt)}
            </Text>
          </View>
        )}
      </View>

      {submission.isLate && (
        <Banner tone="warning">
          <BannerIcon icon={ClockIcon} />
          <BannerContent>
            <BannerTitle>{t('submittedAfterDue')}</BannerTitle>
          </BannerContent>
        </Banner>
      )}

      {graded && (
        <Banner tone="info">
          <BannerIcon icon={CheckCircleIcon} />
          <BannerContent>
            <BannerTitle>{t('alreadyGraded')}</BannerTitle>
            <BannerDescription>
              {t('alreadyGradedDescription', { total: submission.total, max: Math.floor(submission.maxPoints) })}
            </BannerDescription>
          </BannerContent>
        </Banner>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: SPACING.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  copy: { flex: 1, gap: 2 },
  meta: { gap: SPACING.xxs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 }
});
