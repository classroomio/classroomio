import { router } from 'expo-router';
import { GraduationCap, RefreshCw } from 'lucide-react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle
} from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useGradingQueueQuery } from '@/feature/teach/api/grading-queue';
import { useTeachingCoursesQuery } from '@/feature/teach/api/teaching-courses';
import { GradingQueueRow } from '@/feature/teach/components/grading-queue-row';
import { GradingSummaryCard } from '@/feature/teach/components/grading-summary-card';
import { TeachCourseRow } from '@/feature/teach/components/teach-course-row';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { GradingQueueItem, TeachingCourse } from '@/feature/teach/types/teach';

const WAITING_PREVIEW = 3;

function openSubmission(item: GradingQueueItem) {
  router.push({ pathname: '/teach/submission/[submissionId]', params: { submissionId: item.id } });
}

function openCourse(course: TeachingCourse) {
  router.push({ pathname: '/teach/course/[courseId]', params: { courseId: course.id, title: course.title } });
}

export default function TeachScreen() {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const courses = useTeachingCoursesQuery();
  const queue = useGradingQueueQuery();
  const refreshing = courses.isRefetching || queue.isRefetching;
  const refresh = () => {
    void courses.refetch();
    void queue.refetch();
  };

  if (courses.isError) {
    return (
      <ScreenScrollView refreshing={refreshing} onRefresh={refresh}>
        <Empty>
          <EmptyMedia icon={GraduationCap} />
          <EmptyTitle>{t('coursesLoadError')}</EmptyTitle>
          <EmptyDescription>{errorMessage(courses.error)}</EmptyDescription>
          <EmptyContent>
            <Button variant="outline" onPress={refresh}>
              <ButtonIcon icon={RefreshCw} />
              <ButtonText>{common('retry')}</ButtonText>
            </Button>
          </EmptyContent>
        </Empty>
      </ScreenScrollView>
    );
  }

  if (courses.isSuccess && courses.data.length === 0) {
    return (
      <ScreenScrollView refreshing={refreshing} onRefresh={refresh}>
        <Empty>
          <EmptyIllustration name="courses" />
          <EmptyTitle>{t('noCoursesTitle')}</EmptyTitle>
          <EmptyDescription>{t('noCoursesDescription')}</EmptyDescription>
        </Empty>
      </ScreenScrollView>
    );
  }

  const waiting = (queue.data ?? []).slice(0, WAITING_PREVIEW);

  return (
    <ScreenScrollView refreshing={refreshing} onRefresh={refresh}>
      <ScreenSection>
        {queue.isPending && <Skeleton height={172} radius={10} />}
        {queue.isError && (
          <Text variant="caption" tone="danger">
            {t('queueLoadErrorInline', { error: errorMessage(queue.error) })}
          </Text>
        )}
        {queue.isSuccess && <GradingSummaryCard queue={queue.data} onOpen={() => router.push('/teach/queue')} />}
      </ScreenSection>

      {waiting.length > 0 && (
        <ScreenSection>
          <ScreenSectionHeader
            title={t('waitingLongest')}
            action={
              queue.data && queue.data.length > WAITING_PREVIEW ? (
                <Button variant="ghost" size="sm" onPress={() => router.push('/teach/queue')}>
                  <ButtonText>{t('seeAll', { count: queue.data.length })}</ButtonText>
                </Button>
              ) : undefined
            }
          />
          <ItemGroup>
            {waiting.map((item) => (
              <GradingQueueRow key={item.id} item={item} onPress={openSubmission} />
            ))}
          </ItemGroup>
        </ScreenSection>
      )}

      <ScreenSection>
        <ScreenSectionHeader
          title={t('yourCourses')}
          action={
            courses.data ? (
              <Text variant="caption" tone="muted">
                {courses.data.length}
              </Text>
            ) : undefined
          }
        />
        {courses.isPending ? (
          <Skeleton height={216} radius={14} />
        ) : (
          <ItemGroup>
            {(courses.data ?? []).map((course) => (
              <TeachCourseRow key={course.id} course={course} onPress={openCourse} />
            ))}
          </ItemGroup>
        )}
      </ScreenSection>
    </ScreenScrollView>
  );
}
