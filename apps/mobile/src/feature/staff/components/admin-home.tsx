import { ChartLineUpIcon } from 'phosphor-react-native/src/icons/ChartLineUp';
import { LightningIcon } from 'phosphor-react-native/src/icons/Lightning';
import { TrendUpIcon } from 'phosphor-react-native/src/icons/TrendUp';
import { UsersIcon } from 'phosphor-react-native/src/icons/Users';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  Item,
  ItemActions,
  ItemChevron,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Skeleton, SkeletonList } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import { CourseThumbnail } from '@/feature/course/components/course-thumbnail';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useOrgHealthQuery } from '@/feature/staff/api/org-insights';
import { useRefreshStaff } from '@/feature/staff/api/refresh-staff';
import { ActivityPreview } from '@/feature/staff/components/activity-preview';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import type { DraftCourse } from '@/feature/staff/types/staff';
import { Stat, StatGrid } from '@/feature/teach/components/stat-grid';

function openCourse(course: DraftCourse) {
  router.push({ pathname: '/courses/[courseId]', params: { courseId: course.id, title: course.title } });
}

/** The admin Home: organization health, the draft courses waiting to be published, and recent learner activity. */
export function AdminHome() {
  const t = useTranslations(staffCatalog);
  const format = useFormatters();
  const health = useOrgHealthQuery();
  const refresh = useRefreshStaff();
  const data = health.data;

  return (
    <ScreenScrollView onRefresh={refresh}>
      <ScreenSection>
        <ScreenSectionHeader title={t('organizationHealth')} />
        {health.isPending ? <Skeleton height={236} radius={RADII.xl} /> : null}
        {health.isError ? (
          <Text variant="caption" tone="danger">
            {t('healthLoadErrorInline', { error: errorMessage(health.error) })}
          </Text>
        ) : null}
        {data ? (
          <View style={styles.grid}>
            <StatGrid>
              <Stat
                label={t('statActiveLearners')}
                icon={UsersIcon}
                tone="primary"
                value={format.number(data.activeLearners)}
                detail={t('statActiveLearnersDetail', { count: data.learners })}
              />
              <Stat
                label={t('statCompletionRate')}
                icon={ChartLineUpIcon}
                tone="success"
                value={format.percent(data.completionRate)}
              />
            </StatGrid>
            <StatGrid>
              <Stat label={t('statActivityWeek')} icon={LightningIcon} value={format.number(data.recentActivity)} />
              <Stat label={t('statAverageProgress')} icon={TrendUpIcon} value={format.percent(data.averageProgress)} />
            </StatGrid>
          </View>
        ) : null}
      </ScreenSection>

      <ScreenSection>
        <ScreenSectionHeader title={t('draftCourses')} />
        {health.isPending ? <SkeletonList count={2} media="thumbnail" /> : null}
        {data ? (
          <Text variant="caption" tone="muted">
            {t('courseCounts', {
              published: format.number(data.courses.published),
              drafts: format.number(data.courses.drafts)
            })}
          </Text>
        ) : null}
        {data && data.draftCourses.length === 0 ? (
          <Text variant="caption" tone="muted">
            {t('noDrafts')}
          </Text>
        ) : null}
        {data && data.draftCourses.length > 0 ? (
          <ItemGroup>
            {data.draftCourses.map((course) => (
              <Item key={course.id} onPress={() => openCourse(course)}>
                <ItemMedia>
                  <CourseThumbnail uri={course.bannerImage || course.logo} size={44} recyclingKey={course.id} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle numberOfLines={2}>{course.title}</ItemTitle>
                  {course.updatedAt ? (
                    <ItemDescription numberOfLines={1}>
                      {t('lastEdited', { date: format.shortDate(new Date(parseTimestamp(course.updatedAt))) })}
                    </ItemDescription>
                  ) : null}
                </ItemContent>
                <ItemActions>
                  <ItemChevron />
                </ItemActions>
              </Item>
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
