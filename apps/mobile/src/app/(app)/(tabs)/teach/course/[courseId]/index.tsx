import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { CalendarCheckIcon } from 'phosphor-react-native/src/icons/CalendarCheck';
import { ClipboardTextIcon } from 'phosphor-react-native/src/icons/ClipboardText';
import { MegaphoneIcon } from 'phosphor-react-native/src/icons/Megaphone';
import { NewspaperIcon } from 'phosphor-react-native/src/icons/Newspaper';
import { UsersIcon } from 'phosphor-react-native/src/icons/Users';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { FlashHighlight } from '@/feature/common/components/flash-highlight';
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
import { useRevealAnnouncement } from '@/feature/teach/helpers/announcement-reveal';
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
  const scrollRef = useRef<ScrollViewInstance>(null);
  const announcement = useRevealAnnouncement(
    courseId,
    posts.map((post) => post.id),
    scrollRef
  );
  const learners = [...(analytics.data?.students ?? [])]
    .sort((first, second) => first.progressPercentage - second.progressPercentage)
    .slice(0, LEARNER_PREVIEW);

  const openComments = (post: NewsfeedPost) =>
    router.push({ pathname: '/teach/course/[courseId]/post/[feedId]', params: { courseId, feedId: post.id } });

  const refresh = () => Promise.all([courses.refetch(), analytics.refetch(), newsfeed.refetch()]);

  if (courses.isSuccess && !course) {
    return (
      <ScreenScrollView>
        <Empty>
          <EmptyMedia icon={WarningCircleIcon} />
          <EmptyTitle>{t('courseUnavailableTitle')}</EmptyTitle>
          <EmptyDescription>{t('courseUnavailableDescription')}</EmptyDescription>
        </Empty>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView ref={scrollRef} onRefresh={refresh}>
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
          <Stat label={t('statEnrolled')} icon={UsersIcon} value={format.number(course.enrolled)} />
          <Stat
            label={t('statCompleted')}
            icon={CalendarCheckIcon}
            value={format.percent(course.completionRate)}
            detail={t('statCompletedDetail', { completed: course.completed, enrolled: course.enrolled })}
          />
          {course.overdue !== null ? (
            <Stat
              label={t('statOverdue')}
              icon={WarningCircleIcon}
              value={format.number(course.overdue)}
              tone={course.overdue > 0 ? 'danger' : 'ink'}
              detail={t('statOverdueDetail')}
            />
          ) : (
            <Stat
              label={t('statToGrade')}
              icon={ClipboardTextIcon}
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
              <ButtonIcon icon={ClipboardTextIcon} />
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
                <ButtonIcon icon={CalendarCheckIcon} />
                <ButtonText>{t('attendance')}</ButtonText>
              </Button>
            )}
            <Button
              variant="outline"
              style={styles.action}
              onPress={() => router.push({ pathname: '/teach/course/[courseId]/announce', params: { courseId } })}
            >
              <ButtonIcon icon={MegaphoneIcon} />
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
            <EmptyMedia icon={NewspaperIcon} />
            <EmptyTitle>{t('newsfeedLoadError')}</EmptyTitle>
            <EmptyDescription>{errorMessage(newsfeed.error)}</EmptyDescription>
            <EmptyContent>
              <Button variant="outline" onPress={() => newsfeed.refetch()}>
                <ButtonIcon icon={ArrowsClockwiseIcon} />
                <ButtonText>{common('retry')}</ButtonText>
              </Button>
            </EmptyContent>
          </Empty>
        )}
        {newsfeed.isSuccess && posts.length === 0 && (
          <Empty>
            <EmptyMedia icon={NewspaperIcon} />
            <EmptyTitle>{t('noPostsTitle')}</EmptyTitle>
            <EmptyDescription>{t('noPostsDescription')}</EmptyDescription>
          </Empty>
        )}
        {posts.map((post) => (
          <View key={post.id} ref={announcement.postRef(post.id)}>
            <FlashHighlight active={announcement.highlightedId === post.id}>
              <CourseFeedPost courseId={courseId} post={post} onOpenComments={openComments} />
            </FlashHighlight>
          </View>
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
