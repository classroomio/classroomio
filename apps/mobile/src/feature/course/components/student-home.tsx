import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { router, Stack } from 'expo-router';
import { useRef } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AskAiButton } from '@/feature/assistant/components/ask-ai-button';
import { AssistantSheet } from '@/feature/assistant/components/assistant-sheet';
import { useAuth } from '@/feature/auth/components/auth-provider';
import type { SheetRef } from '@/feature/common/components/bottom-sheet';
import { Empty, EmptyDescription, EmptyIllustration, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { PagedCarousel } from '@/feature/common/components/paged-carousel';
import { ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Text } from '@/feature/common/components/text';
import { GUTTER, HIT_SLOP, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useEnrolledCoursesQuery } from '@/feature/course/api/enrolled-courses';
import { useHomeDigestQuery } from '@/feature/course/api/home-digest';
import { AnimatedScreenScrollView } from '@/feature/course/components/animated-screen-scroll-view';
import { ContinueLearningCard } from '@/feature/course/components/continue-learning-card';
import { COURSE_CARD_WIDTH, CourseCard } from '@/feature/course/components/course-card';
import { HomeSkeleton } from '@/feature/course/components/course-skeletons';
import { HomeGreeting } from '@/feature/course/components/home-greeting';
import { retakeDueDays, retakeLabel } from '@/feature/course/helpers/compliance-retake';
import { homeStatusOf } from '@/feature/course/helpers/home-status';
import { courseToResume, courseToStart, learningStatusOf } from '@/feature/course/helpers/learning-status';
import { useScrollThreshold } from '@/feature/course/helpers/use-scroll-threshold';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse } from '@/feature/course/types/course';
import { useGoalsQuery } from '@/feature/goals/api/goals';
import { StreakWelcome } from '@/feature/goals/components/streak-welcome';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useEnrolledPathsQuery } from '@/feature/learning-path/api/learning-paths';
import { PathCard } from '@/feature/learning-path/components/path-card';
import type { EnrolledPath } from '@/feature/learning-path/types/learning-path';
import { useLiveClassesQuery } from '@/feature/live-class/api/live-classes';
import { LiveClassCard } from '@/feature/live-class/components/live-class-card';
import { liveClassCatalog } from '@/feature/live-class/translations/catalog';
import type { LiveClass } from '@/feature/live-class/types/live-class';

const GREETING_HEIGHT = 44;
const TAB_BAR_CLEARANCE = Platform.select({ ios: 64, default: 80 });
const LIVE_CARD_PEEK = 40;

type CurrentItem =
  | { kind: 'path'; key: string; path: EnrolledPath }
  | { kind: 'course'; key: string; course: EnrolledCourse; retake: number | null };

function currentLearningOf(courses: EnrolledCourse[], paths: EnrolledPath[], resumeId: string | null): CurrentItem[] {
  const retakes: CurrentItem[] = [];
  const active: CurrentItem[] = [];

  for (const course of courses) {
    const retake = course.type === 'COMPLIANCE' ? retakeDueDays(course) : null;
    if (retake !== null) {
      retakes.push({ kind: 'course', key: `course-${course.id}`, course, retake });
      continue;
    }

    if (course.id === resumeId || learningStatusOf(course) !== 'in-progress') continue;

    active.push({ kind: 'course', key: `course-${course.id}`, course, retake: null });
  }

  const pathItems: CurrentItem[] = paths
    .filter((path) => !path.completedAt)
    .map((path) => ({ kind: 'path', key: `path-${path.id}`, path }));

  return [
    ...retakes.sort((a, b) => (a.kind === 'course' && b.kind === 'course' ? (a.retake ?? 0) - (b.retake ?? 0) : 0)),
    ...pathItems,
    ...active
  ];
}

function liveClassKey(liveClass: LiveClass) {
  return liveClass.lessonId;
}

/** The student Home: where to resume, what they are working through, upcoming live classes and the assistant. */
export function StudentHome() {
  const t = useTranslations(courseCatalog);
  const tl = useTranslations(liveClassCatalog);
  const common = useTranslations(commonCatalog);
  const { userId } = useAuth();
  const offline = useIsOffline();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const assistant = useRef<SheetRef>(null);
  const courses = useEnrolledCoursesQuery();
  const paths = useEnrolledPathsQuery();
  const liveClasses = useLiveClassesQuery();
  const goals = useGoalsQuery();
  const digest = useHomeDigestQuery();
  const { onScroll, past } = useScrollThreshold(GREETING_HEIGHT);
  const resume = courseToResume(courses.data ?? []);
  const start = resume ? null : courseToStart(courses.data ?? []);
  const current = currentLearningOf(courses.data ?? [], paths.data ?? [], resume?.id ?? null);
  const upcoming = liveClasses.data ?? [];
  const status = courses.data ? homeStatusOf(courses.data, digest.data) : null;
  const liveCardWidth = width - GUTTER * 2 - LIVE_CARD_PEEK;

  const openResume = resume
    ? () => router.push({ pathname: '/course/[courseId]', params: { courseId: resume.id } })
    : null;

  const seeAll = (
    <Pressable accessibilityRole="link" hitSlop={HIT_SLOP} onPress={() => router.navigate('/learning')}>
      <Text variant="captionStrong" tone="primary">
        {t('seeAll')}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: past ? common('tabHome') : '' }} />
      <AnimatedScreenScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: SPACING.xxxl + 56 }}
        onRefresh={() =>
          Promise.all([courses.refetch(), paths.refetch(), liveClasses.refetch(), goals.refetch(), digest.refetch()])
        }
      >
        <HomeGreeting status={status} />

        {courses.isPending ? <HomeSkeleton /> : null}

        {courses.isError ? (
          <Empty>
            <EmptyMedia icon={BookOpenIcon} />
            <EmptyTitle>{t('coursesLoadError')}</EmptyTitle>
            <EmptyDescription>{errorMessage(courses.error)}</EmptyDescription>
          </Empty>
        ) : null}

        {courses.isSuccess && courses.data.length === 0 && (paths.data?.length ?? 0) === 0 ? (
          <Empty>
            <EmptyIllustration name="courses" />
            <EmptyTitle>{t('homeNoCoursesTitle')}</EmptyTitle>
            <EmptyDescription>{t('homeNoCoursesDescription')}</EmptyDescription>
          </Empty>
        ) : null}

        {resume ? (
          <ScreenSection>
            <ScreenSectionHeader title={t('pickUpTitle')} />
            <ContinueLearningCard course={resume} />
          </ScreenSection>
        ) : start ? (
          <ScreenSection>
            <ScreenSectionHeader title={t('startTitle')} />
            <ContinueLearningCard course={start} starting />
          </ScreenSection>
        ) : null}

        {current.length > 0 ? (
          <ScreenSection>
            <ScreenSectionHeader title={t('currentLearning')} action={seeAll} />
            <PagedCarousel
              items={current}
              itemWidth={COURSE_CARD_WIDTH}
              keyOf={(item) => item.key}
              renderItem={(item) =>
                item.kind === 'path' ? (
                  <PathCard path={item.path} />
                ) : (
                  <CourseCard
                    course={item.course}
                    status={
                      item.retake === null ? undefined : { label: retakeLabel(item.retake, t), urgent: item.retake < 0 }
                    }
                  />
                )
              }
            />
          </ScreenSection>
        ) : null}

        {upcoming.length > 0 ? (
          <ScreenSection>
            <ScreenSectionHeader title={tl('upcomingTitle')} />
            <PagedCarousel
              items={upcoming}
              itemWidth={upcoming.length > 1 ? liveCardWidth : width - GUTTER * 2}
              keyOf={liveClassKey}
              renderItem={(liveClass) => <LiveClassCard liveClass={liveClass} />}
            />
          </ScreenSection>
        ) : null}
      </AnimatedScreenScrollView>

      {offline ? null : (
        <AskAiButton
          bottom={insets.bottom + TAB_BAR_CLEARANCE + SPACING.sm}
          onPress={() => assistant.current?.present()}
        />
      )}
      <AssistantSheet ref={assistant} />
      <StreakWelcome userId={userId} goals={goals.data} onResume={openResume} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }
});
