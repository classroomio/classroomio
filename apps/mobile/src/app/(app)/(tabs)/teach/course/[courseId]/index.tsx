import { router, useLocalSearchParams } from 'expo-router';
import {
  CalendarCheck,
  CircleAlert,
  ClipboardCheck,
  Megaphone,
  Newspaper,
  RefreshCw,
  Users
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { COURSE_TYPE_KEYS } from '@/feature/course/constants/course-type';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useCourseNewsfeedQuery } from '@/feature/teach/api/course-newsfeed';
import { useCourseAnalyticsQuery } from '@/feature/teach/api/teach-course';
import { useTeachingCoursesQuery } from '@/feature/teach/api/teaching-courses';
import { CourseFeedPost } from '@/feature/teach/components/course-feed-post';
import { LearnerProgressRow } from '@/feature/teach/components/learner-progress-row';
import { Stat, StatGrid } from '@/feature/teach/components/stat-grid';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { NewsfeedPost } from '@/feature/teach/types/teach';

const LEARNER_PREVIEW = 5;

export default function TeachCourseScreen() {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const courseCopy = useTranslations(courseCatalog);
  const format = useFormatters();
  const { courseId = '', title } = useLocalSearchParams<{ courseId: string; title?: string }>();
  const courses = useTeachingCoursesQuery();
  const analytics = useCourseAnalyticsQuery(courseId);
  const newsfeed = useCourseNewsfeedQuery(courseId);
  const course = courses.data?.find((candidate) => candidate.id === courseId);
  const posts = newsfeed.data?.pages.flatMap((page) => page.items) ?? [];
  const learners = [...(analytics.data?.students ?? [])]
    .sort((first, second) => first.progressPercentage - second.progressPercentage)
    .slice(0, LEARNER_PREVIEW);

  const openComments = (post: NewsfeedPost) =>
    router.push({ pathname: '/teach/course/[courseId]/post/[feedId]', params: { courseId, feedId: post.id } });

  const refresh = () => {
    void courses.refetch();
    void analytics.refetch();
    void newsfeed.refetch();
  };

  if (courses.isSuccess && !course) {
    return (
      <ScreenScrollView>
        <Empty>
          <EmptyMedia icon={CircleAlert} />
          <EmptyTitle>{t('courseUnavailableTitle')}</EmptyTitle>
          <EmptyDescription>{t('courseUnavailableDescription')}</EmptyDescription>
        </Empty>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView refreshing={courses.isRefetching || newsfeed.isRefetching} onRefresh={refresh}>
      <View style={styles.heading}>
        <Text variant="title" accessibilityRole="header">
          {course?.title ?? title}
        </Text>
        {course?.type ? (
          <Text variant="caption" tone="muted">
            {course.type in COURSE_TYPE_KEYS
              ? courseCopy(COURSE_TYPE_KEYS[course.type as keyof typeof COURSE_TYPE_KEYS])
              : course.type}
          </Text>
        ) : null}
      </View>

      {!course ? (
        <Skeleton height={92} radius={12} />
      ) : (
        <StatGrid>
          <Stat label={t('statEnrolled')} icon={Users} value={format.number(course.enrolled)} />
          <Stat
            label={t('statCompleted')}
            icon={CalendarCheck}
            value={format.percent(course.completionRate)}
            detail={t('statCompletedDetail', { completed: course.completed, enrolled: course.enrolled })}
          />
          {course.overdue !== null ? (
            <Stat
              label={t('statOverdue')}
              icon={CircleAlert}
              value={format.number(course.overdue)}
              tone={course.overdue > 0 ? 'danger' : 'ink'}
              detail={t('statOverdueDetail')}
            />
          ) : (
            <Stat
              label={t('statToGrade')}
              icon={ClipboardCheck}
              value={format.number(course.toGrade)}
              tone={course.toGrade > 0 ? 'primary' : 'ink'}
            />
          )}
        </StatGrid>
      )}

      {course && (
        <ScreenSection>
          {course.toGrade > 0 && (
            <Button
              onPress={() => router.push({ pathname: '/teach/queue', params: { courseId, courseTitle: course.title } })}
            >
              <ButtonIcon icon={ClipboardCheck} />
              <ButtonText>{t('gradeSubmissions', { count: course.toGrade })}</ButtonText>
            </Button>
          )}
          <View style={styles.actions}>
            {course.type === 'LIVE_CLASS' && (
              <Button
                variant="outline"
                style={styles.action}
                onPress={() => router.push({ pathname: '/teach/course/[courseId]/attendance', params: { courseId } })}
              >
                <ButtonIcon icon={CalendarCheck} />
                <ButtonText>{t('attendance')}</ButtonText>
              </Button>
            )}
            <Button
              variant="outline"
              style={styles.action}
              onPress={() => router.push({ pathname: '/teach/course/[courseId]/announce', params: { courseId } })}
            >
              <ButtonIcon icon={Megaphone} />
              <ButtonText>{t('announce')}</ButtonText>
            </Button>
          </View>
        </ScreenSection>
      )}

      <ScreenSection>
        <ScreenSectionHeader title={t('lowestProgress')} />
        {analytics.isPending && <Skeleton height={180} radius={14} />}
        {analytics.isError && (
          <Text variant="caption" tone="muted">
            {t('learnerProgressLoadError', { error: errorMessage(analytics.error) })}
          </Text>
        )}
        {analytics.isSuccess && learners.length === 0 && (
          <Text variant="caption" tone="muted">
            {t('noLearnersYet')}
          </Text>
        )}
        {learners.length > 0 && (
          <ItemGroup>
            {learners.map((learner) => (
              <LearnerProgressRow key={learner.id} learner={learner} />
            ))}
          </ItemGroup>
        )}
      </ScreenSection>

      <ScreenSection>
        <ScreenSectionHeader title={t('newsfeed')} />
        {newsfeed.isPending && <Skeleton height={160} radius={14} />}
        {newsfeed.isError && (
          <Empty>
            <EmptyMedia icon={Newspaper} />
            <EmptyTitle>{t('newsfeedLoadError')}</EmptyTitle>
            <EmptyDescription>{errorMessage(newsfeed.error)}</EmptyDescription>
            <EmptyContent>
              <Button variant="outline" onPress={() => newsfeed.refetch()}>
                <ButtonIcon icon={RefreshCw} />
                <ButtonText>{common('retry')}</ButtonText>
              </Button>
            </EmptyContent>
          </Empty>
        )}
        {newsfeed.isSuccess && posts.length === 0 && (
          <Empty>
            <EmptyMedia icon={Newspaper} />
            <EmptyTitle>{t('noPostsTitle')}</EmptyTitle>
            <EmptyDescription>{t('noPostsDescription')}</EmptyDescription>
          </Empty>
        )}
        {posts.map((post) => (
          <CourseFeedPost key={post.id} courseId={courseId} post={post} onOpenComments={openComments} />
        ))}
        {newsfeed.hasNextPage && (
          <Button variant="ghost" disabled={newsfeed.isFetchingNextPage} onPress={() => newsfeed.fetchNextPage()}>
            {newsfeed.isFetchingNextPage ? <ButtonSpinner /> : <ButtonText>{t('loadOlderPosts')}</ButtonText>}
          </Button>
        )}
      </ScreenSection>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 2, marginTop: SPACING.xs },
  actions: { flexDirection: 'row', gap: SPACING.xs },
  action: { flex: 1 }
});
