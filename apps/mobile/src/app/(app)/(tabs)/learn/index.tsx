import { router } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { useMemo, useState } from 'react';

import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { ScreenScrollView, ScreenSection } from '@/feature/common/components/screen';
import { SegmentedControl, SegmentedControlItem } from '@/feature/common/components/segmented-control';
import { Skeleton } from '@/feature/common/components/skeleton';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useEnrolledCoursesQuery } from '@/feature/course/api/enrolled-courses';
import { CourseRow } from '@/feature/course/components/course-row';
import { learningStatusOf } from '@/feature/course/helpers/learning-status';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse, LearningStatus } from '@/feature/course/types/course';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const EMPTY_KEYS = {
  'in-progress': { title: 'emptyInProgressTitle', description: 'emptyInProgressDescription' },
  'not-started': { title: 'emptyNotStartedTitle', description: 'emptyNotStartedDescription' },
  completed: { title: 'emptyCompletedTitle', description: 'emptyCompletedDescription' }
} as const satisfies Record<LearningStatus, { title: string; description: string }>;

function openCourse(course: EnrolledCourse) {
  router.push({ pathname: '/course/[courseId]', params: { courseId: course.id } });
}

export default function LearnScreen() {
  const t = useTranslations(courseCatalog);
  const courses = useEnrolledCoursesQuery();
  const [status, setStatus] = useState<LearningStatus>('in-progress');
  const visible = useMemo(
    () => (courses.data ?? []).filter((course) => learningStatusOf(course) === status),
    [courses.data, status]
  );

  return (
    <ScreenScrollView refreshing={courses.isRefetching} onRefresh={() => courses.refetch()}>
      <SegmentedControl value={status} onValueChange={setStatus}>
        <SegmentedControlItem value="in-progress">{t('filterInProgress')}</SegmentedControlItem>
        <SegmentedControlItem value="not-started">{t('filterNotStarted')}</SegmentedControlItem>
        <SegmentedControlItem value="completed">{t('filterCompleted')}</SegmentedControlItem>
      </SegmentedControl>

      {courses.isPending && <Skeleton height={280} radius={14} />}

      {courses.isError && (
        <Empty>
          <EmptyMedia icon={BookOpen} />
          <EmptyTitle>{t('coursesLoadError')}</EmptyTitle>
          <EmptyDescription>{errorMessage(courses.error)}</EmptyDescription>
        </Empty>
      )}

      {courses.isSuccess && visible.length === 0 && (
        <Empty>
          <EmptyMedia icon={BookOpen} />
          <EmptyTitle>{t(EMPTY_KEYS[status].title)}</EmptyTitle>
          <EmptyDescription>{t(EMPTY_KEYS[status].description)}</EmptyDescription>
        </Empty>
      )}

      {visible.length > 0 && (
        <ScreenSection>
          <ItemGroup>
            {visible.map((course) => (
              <CourseRow key={course.id} course={course} onPress={openCourse} />
            ))}
          </ItemGroup>
        </ScreenSection>
      )}
    </ScreenScrollView>
  );
}
