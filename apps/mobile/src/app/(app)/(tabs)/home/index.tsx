import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { router, Stack } from 'expo-router';
import { useMemo } from 'react';
import { Pressable } from 'react-native';

import { Empty, EmptyDescription, EmptyIllustration, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useComplianceQuery } from '@/feature/compliance/api/compliance';
import { ComplianceAlertBand } from '@/feature/compliance/components/compliance-alert-band';
import { useEnrolledCoursesQuery } from '@/feature/course/api/enrolled-courses';
import { useHomeDigestQuery } from '@/feature/course/api/home-digest';
import { AnimatedScreenScrollView } from '@/feature/course/components/animated-screen-scroll-view';
import { ContinueLearningCard } from '@/feature/course/components/continue-learning-card';
import { CourseCarousel } from '@/feature/course/components/course-carousel';
import { HomeSkeleton } from '@/feature/course/components/course-skeletons';
import { DueSoonList } from '@/feature/course/components/due-soon-list';
import { HomeGreeting } from '@/feature/course/components/home-greeting';
import { NextLiveClassCard } from '@/feature/course/components/next-live-class-card';
import { homeStatusOf } from '@/feature/course/helpers/home-status';
import { courseToResume, learningStatusOf } from '@/feature/course/helpers/learning-status';
import { useScrollThreshold } from '@/feature/course/helpers/use-scroll-threshold';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useNotificationsQuery } from '@/feature/notifications/api/notifications';
import { RecentUpdates } from '@/feature/notifications/components/recent-updates';

const GREETING_HEIGHT = 44;
const RECENT_UPDATES_LIMIT = 3;

export default function HomeScreen() {
  const t = useTranslations(courseCatalog);
  const common = useTranslations(commonCatalog);
  const courses = useEnrolledCoursesQuery();
  const compliance = useComplianceQuery();
  const { onScroll, past } = useScrollThreshold(GREETING_HEIGHT);
  const resume = useMemo(() => courseToResume(courses.data ?? []), [courses.data]);
  const digest = useHomeDigestQuery();
  const nextLive = digest.data?.nextLiveClass ?? null;
  const dueSoon = digest.data?.dueSoon ?? [];
  const notifications = useNotificationsQuery();
  const updates = notifications.data?.pages[0]?.items.slice(0, RECENT_UPDATES_LIMIT) ?? [];
  const status = courses.data ? homeStatusOf(courses.data, digest.data) : null;
  const unfinished = useMemo(
    () =>
      (courses.data ?? [])
        .filter((course) => course.id !== resume?.id && learningStatusOf(course) !== 'completed')
        .sort((a, b) => Number(learningStatusOf(a) === 'not-started') - Number(learningStatusOf(b) === 'not-started')),
    [courses.data, resume]
  );

  return (
    <>
      <Stack.Screen options={{ title: past ? common('tabHome') : '' }} />
      <AnimatedScreenScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        onRefresh={() =>
          Promise.all([courses.refetch(), digest.refetch(), compliance.refetch(), notifications.refetch()])
        }
      >
        <HomeGreeting status={status} />

        <ComplianceAlertBand />

        {courses.isPending && <HomeSkeleton />}

        {courses.isError && (
          <Empty>
            <EmptyMedia icon={BookOpenIcon} />
            <EmptyTitle>{t('coursesLoadError')}</EmptyTitle>
            <EmptyDescription>{errorMessage(courses.error)}</EmptyDescription>
          </Empty>
        )}

        {courses.isSuccess && courses.data.length === 0 && (
          <Empty>
            <EmptyIllustration name="courses" />
            <EmptyTitle>{t('homeNoCoursesTitle')}</EmptyTitle>
            <EmptyDescription>{t('homeNoCoursesDescription')}</EmptyDescription>
          </Empty>
        )}

        {nextLive && (
          <ScreenSection>
            <ScreenSectionHeader title={nextLive.isLive ? t('liveNow') : t('nextLiveClass')} />
            <NextLiveClassCard next={nextLive} />
          </ScreenSection>
        )}

        {resume && (
          <ScreenSection>
            <ScreenSectionHeader title={t('continueLearning')} />
            <ContinueLearningCard course={resume} />
          </ScreenSection>
        )}

        {dueSoon.length > 0 && (
          <ScreenSection>
            <ScreenSectionHeader title={t('dueSoon')} />
            <DueSoonList items={dueSoon} />
          </ScreenSection>
        )}

        {unfinished.length > 0 && (
          <ScreenSection>
            <ScreenSectionHeader
              title={resume ? t('upNext') : t('yourCourses')}
              action={
                <Pressable accessibilityRole="link" hitSlop={HIT_SLOP} onPress={() => router.navigate('/learn')}>
                  <Text variant="captionStrong" tone="primary">
                    {t('seeAll')}
                  </Text>
                </Pressable>
              }
            />
            <CourseCarousel courses={unfinished} />
          </ScreenSection>
        )}

        {updates.length > 0 && (
          <ScreenSection>
            <ScreenSectionHeader
              title={t('recentUpdates')}
              action={
                <Pressable accessibilityRole="link" hitSlop={HIT_SLOP} onPress={() => router.push('/notifications')}>
                  <Text variant="captionStrong" tone="primary">
                    {t('seeAll')}
                  </Text>
                </Pressable>
              }
            />
            <RecentUpdates items={updates} />
          </ScreenSection>
        )}
      </AnimatedScreenScrollView>
    </>
  );
}
