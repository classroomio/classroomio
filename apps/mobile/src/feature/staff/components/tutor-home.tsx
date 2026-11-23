import { ChartLineUpIcon } from 'phosphor-react-native/src/icons/ChartLineUp';
import { ClipboardTextIcon } from 'phosphor-react-native/src/icons/ClipboardText';
import { ExamIcon } from 'phosphor-react-native/src/icons/Exam';
import { UsersIcon } from 'phosphor-react-native/src/icons/Users';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Empty, EmptyDescription, EmptyIllustration, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Skeleton, SkeletonList } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useRefreshStaff } from '@/feature/staff/api/refresh-staff';
import { useTeachingSessionsQuery, useTeachingStatsQuery } from '@/feature/staff/api/teaching-insights';
import { ActivityPreview } from '@/feature/staff/components/activity-preview';
import { SessionRow } from '@/feature/staff/components/session-row';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import type { TeachingSession } from '@/feature/staff/types/staff';
import { Stat, StatGrid } from '@/feature/teach/components/stat-grid';
import { teachCatalog } from '@/feature/teach/translations/catalog';

function openSession(session: TeachingSession) {
  router.push({
    pathname: '/courses/[courseId]/attendance',
    params: { courseId: session.courseId, lessonId: session.lessonId }
  });
}

/** The tutor Home: key numbers, upcoming live sessions and recent learner activity across their courses. */
export function TutorHome() {
  const t = useTranslations(staffCatalog);
  const teach = useTranslations(teachCatalog);
  const format = useFormatters();
  const stats = useTeachingStatsQuery();
  const sessions = useTeachingSessionsQuery();
  const refresh = useRefreshStaff();

  if (stats.isSuccess && stats.data.courses === 0) {
    return (
      <ScreenScrollView onRefresh={refresh}>
        <Empty>
          <EmptyIllustration name="courses" />
          <EmptyTitle>{teach('noCoursesTitle')}</EmptyTitle>
          <EmptyDescription>{teach('noCoursesDescription')}</EmptyDescription>
        </Empty>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView onRefresh={refresh}>
      <ScreenSection>
        <ScreenSectionHeader title={t('keyNumbers')} />
        {stats.isPending ? <Skeleton height={236} radius={RADII.xl} /> : null}
        {stats.isError ? (
          <Text variant="caption" tone="danger">
            {t('statsLoadErrorInline', { error: errorMessage(stats.error) })}
          </Text>
        ) : null}
        {stats.data ? (
          <View style={styles.grid}>
            <StatGrid>
              <Stat
                label={t('statActiveLearners')}
                icon={UsersIcon}
                tone="primary"
                value={format.number(stats.data.activeLearners)}
                detail={t('statActiveLearnersDetail', { count: stats.data.learners })}
              />
              <Stat
                label={t('statAverageCompletion')}
                icon={ChartLineUpIcon}
                tone="success"
                value={format.percent(stats.data.averageCompletion)}
              />
            </StatGrid>
            <StatGrid>
              <Stat
                label={t('statToReview')}
                icon={ClipboardTextIcon}
                tone={stats.data.itemsToReview > 0 ? 'warning' : 'neutral'}
                value={format.number(stats.data.itemsToReview)}
              />
              <Stat
                label={t('statQuizScore')}
                icon={ExamIcon}
                value={stats.data.averageQuizScore === null ? '–' : format.percent(stats.data.averageQuizScore)}
                detail={stats.data.averageQuizScore === null ? t('statNoGrades') : undefined}
              />
            </StatGrid>
          </View>
        ) : null}
      </ScreenSection>

      <ScreenSection>
        <ScreenSectionHeader title={t('upcomingSessions')} />
        {sessions.isPending ? <SkeletonList count={2} /> : null}
        {sessions.isError ? (
          <Text variant="caption" tone="danger">
            {t('sessionsLoadErrorInline', { error: errorMessage(sessions.error) })}
          </Text>
        ) : null}
        {sessions.isSuccess && sessions.data.length === 0 ? (
          <Text variant="caption" tone="muted">
            {t('noSessions')}
          </Text>
        ) : null}
        {sessions.data && sessions.data.length > 0 ? (
          <ItemGroup>
            {sessions.data.map((session) => (
              <SessionRow key={session.lessonId} session={session} onPress={openSession} />
            ))}
          </ItemGroup>
        ) : null}
      </ScreenSection>

      <ActivityPreview />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { gap: SPACING.xs }
});
