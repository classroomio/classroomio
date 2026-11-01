import { router } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { useMemo } from 'react';

import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useComplianceQuery } from '@/feature/compliance/api/compliance';
import { ComplianceAlertBand } from '@/feature/compliance/components/compliance-alert-band';
import { useEnrolledCoursesQuery } from '@/feature/course/api/enrolled-courses';
import { ContinueLearningCard } from '@/feature/course/components/continue-learning-card';
import { CourseRow } from '@/feature/course/components/course-row';
import { courseToResume, learningStatusOf } from '@/feature/course/helpers/learning-status';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse } from '@/feature/course/types/course';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

function openCourse(course: EnrolledCourse) {
  router.push({ pathname: '/course/[courseId]', params: { courseId: course.id } });
}

export default function HomeScreen() {
  const t = useTranslations(courseCatalog);
  const format = useFormatters();
  const courses = useEnrolledCoursesQuery();
  const compliance = useComplianceQuery();
  const resume = useMemo(() => courseToResume(courses.data ?? []), [courses.data]);
  const unfinished = useMemo(
    () => (courses.data ?? []).filter((course) => course.id !== resume?.id && learningStatusOf(course) !== 'completed'),
    [courses.data, resume]
  );

  return (
    <ScreenScrollView
      refreshing={courses.isRefetching}
      onRefresh={() => {
        void courses.refetch();
        void compliance.refetch();
      }}
    >
      <ComplianceAlertBand />

      {courses.isPending && (
        <ScreenSection>
          <Skeleton height={168} radius={10} />
          <Skeleton height={220} radius={14} />
        </ScreenSection>
      )}

      {courses.isError && (
        <Empty>
          <EmptyMedia icon={BookOpen} />
          <EmptyTitle>{t('coursesLoadError')}</EmptyTitle>
          <EmptyDescription>{errorMessage(courses.error)}</EmptyDescription>
        </Empty>
      )}

      {courses.isSuccess && courses.data.length === 0 && (
        <Empty>
          <EmptyMedia icon={BookOpen} />
          <EmptyTitle>{t('homeNoCoursesTitle')}</EmptyTitle>
          <EmptyDescription>{t('homeNoCoursesDescription')}</EmptyDescription>
        </Empty>
      )}

      {resume && (
        <ScreenSection>
          <ScreenSectionHeader title={t('continueLearning')} />
          <ContinueLearningCard course={resume} onContinue={openCourse} />
        </ScreenSection>
      )}

      {unfinished.length > 0 && (
        <ScreenSection>
          <ScreenSectionHeader
            title={resume ? t('upNext') : t('yourCourses')}
            action={
              <Text variant="caption" tone="muted">
                {format.number(unfinished.length)}
              </Text>
            }
          />
          <ItemGroup>
            {unfinished.map((course) => (
              <CourseRow key={course.id} course={course} onPress={openCourse} />
            ))}
          </ItemGroup>
        </ScreenSection>
      )}
    </ScreenScrollView>
  );
}
