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
import { AnimatedScreenScrollView } from '@/feature/course/components/animated-screen-scroll-view';
import { ContinueLearningCard } from '@/feature/course/components/continue-learning-card';
import { CourseCarousel } from '@/feature/course/components/course-carousel';
import { HomeSkeleton } from '@/feature/course/components/course-skeletons';
import { HomeGreeting } from '@/feature/course/components/home-greeting';
import { homeStatusOf } from '@/feature/course/helpers/home-status';
import { courseToResume, learningStatusOf } from '@/feature/course/helpers/learning-status';
import { useScrollThreshold } from '@/feature/course/helpers/use-scroll-threshold';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const GREETING_HEIGHT = 44;

export default function HomeScreen() {
  const t = useTranslations(courseCatalog);
  const common = useTranslations(commonCatalog);
  const courses = useEnrolledCoursesQuery();
  const compliance = useComplianceQuery();
  const { onScroll, past } = useScrollThreshold(GREETING_HEIGHT);
  const resume = useMemo(() => courseToResume(courses.data ?? []), [courses.data]);
  const status = useMemo(() => (courses.data ? homeStatusOf(courses.data) : null), [courses.data]);
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
        onRefresh={() => Promise.all([courses.refetch(), compliance.refetch()])}
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

        {resume && (
          <ScreenSection>
            <ScreenSectionHeader title={t('continueLearning')} />
            <ContinueLearningCard course={resume} />
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
      </AnimatedScreenScrollView>
    </>
  );
}
