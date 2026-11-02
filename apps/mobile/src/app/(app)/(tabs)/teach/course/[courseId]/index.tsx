import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { CalendarCheckIcon } from 'phosphor-react-native/src/icons/CalendarCheck';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ClipboardTextIcon } from 'phosphor-react-native/src/icons/ClipboardText';
import { MegaphoneIcon } from 'phosphor-react-native/src/icons/Megaphone';
import { NewspaperIcon } from 'phosphor-react-native/src/icons/Newspaper';
import { UsersIcon } from 'phosphor-react-native/src/icons/Users';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { View, type ScrollViewInstance } from 'react-native';

import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { FlashHighlight } from '@/feature/common/components/flash-highlight';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
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
import { Skeleton } from '@/feature/common/components/skeleton';
import { IconTile } from '@/feature/common/components/icon-tile';
import { Text } from '@/feature/common/components/text';
import { RADII } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
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
import { TeachCourseArtwork } from '@/feature/teach/components/teach-course-artwork';
import { TeachSessionCard } from '@/feature/teach/components/teach-session-card';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { NewsfeedPost } from '@/feature/teach/types/teach';

const LEARNER_PREVIEW = 5;

export default function TeachCourseScreen() {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const courseCopy = useTranslations(courseCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
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

  const typeLabel = course?.type
    ? course.type in COURSE_TYPE_KEYS
      ? courseCopy(COURSE_TYPE_KEYS[course.type as keyof typeof COURSE_TYPE_KEYS])
      : course.type
    : null;

  return (
    <ScreenScrollView ref={scrollRef} onRefresh={refresh}>
      <TeachCourseArtwork
        uri={course?.bannerImage || course?.logo}
        recyclingKey={courseId}
        title={course?.title ?? title ?? null}
        meta={typeLabel}
      />

      {!course ? (
        <Skeleton height={124} radius={RADII.xl} />
      ) : (
        <StatGrid>
          <Stat label={t('statEnrolled')} icon={UsersIcon} tone="primary" value={format.number(course.enrolled)} />
          <Stat
            label={t('statCompleted')}
            icon={CheckCircleIcon}
            tone="success"
            value={format.percent(course.completionRate)}
            detail={t('statCompletedDetail', { completed: course.completed, enrolled: course.enrolled })}
          />
          {course.overdue !== null ? (
            <Stat
              label={t('statOverdue')}
              icon={WarningCircleIcon}
              tone={course.overdue > 0 ? 'danger' : 'neutral'}
              value={format.number(course.overdue)}
              detail={t('statOverdueDetail')}
            />
          ) : (
            <Stat
              label={t('statToGrade')}
              icon={ClipboardTextIcon}
              tone={course.toGrade > 0 ? 'warning' : 'neutral'}
              value={format.number(course.toGrade)}
            />
          )}
        </StatGrid>
      )}

      {course?.type === 'LIVE_CLASS' && <TeachSessionCard courseId={courseId} />}

      {course && (
        <ItemGroup>
          <Item
            onPress={() => router.push({ pathname: '/teach/queue', params: { courseId, courseTitle: course.title } })}
          >
            <ItemMedia>
              <IconTile icon={ClipboardTextIcon} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('gradeSubmissionsTitle')}</ItemTitle>
              <ItemDescription numberOfLines={1}>
                {course.toGrade > 0 ? t('toGradeCount', { count: course.toGrade }) : t('allGradedShort')}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <ItemChevron />
            </ItemActions>
          </Item>
          {course.type === 'LIVE_CLASS' ? (
            <Item
              onPress={() => router.push({ pathname: '/teach/course/[courseId]/attendance', params: { courseId } })}
            >
              <ItemMedia>
                <IconTile icon={CalendarCheckIcon} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{t('attendance')}</ItemTitle>
                <ItemDescription numberOfLines={2}>{t('attendanceDescription')}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <ItemChevron />
              </ItemActions>
            </Item>
          ) : null}
          <Item onPress={() => router.push({ pathname: '/teach/course/[courseId]/announce', params: { courseId } })}>
            <ItemMedia>
              <IconTile icon={MegaphoneIcon} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('announce')}</ItemTitle>
              <ItemDescription numberOfLines={2}>{t('announceDescription')}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <ItemChevron />
            </ItemActions>
          </Item>
        </ItemGroup>
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
