import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Award, BookOpen, Megaphone, RotateCcw, WifiOff } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ScreenScrollView } from '@/feature/common/components/screen';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { CourseComplianceBanner } from '@/feature/course/components/course-compliance-banner';
import { CourseContentRow } from '@/feature/course/components/course-content-row';
import { CourseDetailSkeleton } from '@/feature/course/components/course-detail-skeleton';
import { CourseLink, CourseLinks } from '@/feature/course/components/course-links';
import { OutlineList, OutlineSection, OutlineSectionHeader } from '@/feature/course/components/course-outline';
import { CourseSummary, CourseSummaryActions, CourseSummaryProgress } from '@/feature/course/components/course-summary';
import { courseTypeKey } from '@/feature/course/constants/course-type';
import { itemState } from '@/feature/course/helpers/course-content';
import { formatDay } from '@/feature/course/helpers/format-date';
import { openContentItem } from '@/feature/course/helpers/open-content';
import { useCourseOutline } from '@/feature/course/helpers/use-course-outline';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { CourseDownloadStatus } from '@/feature/downloads/components/course-download-status';
import { CourseDownloadHeaderButton } from '@/feature/downloads/components/download-header-button';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const TITLE_THRESHOLD = 48;

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const t = useTranslations(courseCatalog);
  const common = useTranslations(commonCatalog);
  const locale = useLocale();
  const { course, outline, enrollment } = useCourseOutline(courseId);
  const [titleVisible, setTitleVisible] = useState(false);
  const offline = useIsOffline();
  const data = course.data;

  const header = (
    <Stack.Screen
      options={{
        title: titleVisible && data ? data.title : '',
        headerRight: data ? () => <CourseDownloadHeaderButton courseId={courseId} /> : undefined
      }}
    />
  );

  if (course.isPending && offline) {
    return (
      <>
        {header}
        <ScreenScrollView>
          <Empty>
            <EmptyMedia icon={WifiOff} />
            <EmptyTitle>{t('courseNeedsConnectionTitle')}</EmptyTitle>
            <EmptyDescription>{t('courseNeedsConnectionDescription')}</EmptyDescription>
            <EmptyContent>
              <Button variant="outline" onPress={() => course.refetch()}>
                <ButtonText>{common('retry')}</ButtonText>
              </Button>
            </EmptyContent>
          </Empty>
        </ScreenScrollView>
      </>
    );
  }

  if (course.isPending) {
    return (
      <>
        {header}
        <ScreenScrollView scrollEnabled={false}>
          <CourseDetailSkeleton />
        </ScreenScrollView>
      </>
    );
  }

  if (!data || !outline) {
    return (
      <>
        {header}
        <ScreenScrollView refreshing={course.isRefetching} onRefresh={() => course.refetch()}>
          <Empty>
            <EmptyMedia icon={BookOpen} />
            <EmptyTitle>{t('courseLoadError')}</EmptyTitle>
            <EmptyDescription>{errorMessage(course.error)}</EmptyDescription>
            <EmptyContent>
              <Button variant="outline" onPress={() => course.refetch()}>
                <ButtonText>{common('retry')}</ButtonText>
              </Button>
            </EmptyContent>
          </Empty>
        </ScreenScrollView>
      </>
    );
  }

  const isLiveClass = data.type === 'LIVE_CLASS';
  const typeKey = courseTypeKey(data.type);
  const meta = [
    typeKey ? t(typeKey) : null,
    t('lessonCount', { count: outline.lessonCount }),
    outline.exerciseCount > 0 ? t('exerciseCount', { count: outline.exerciseCount }) : null
  ]
    .filter(Boolean)
    .join(' · ');
  const finished = outline.items.length > 0 && outline.completed === outline.items.length;
  const resume = outline.current;
  const firstItem = outline.items[0] ?? null;
  const certificateEarnedAt = enrollment?.certificateEarnedAt ?? null;

  return (
    <>
      {header}
      <ScreenScrollView
        refreshing={course.isRefetching}
        onRefresh={() => course.refetch()}
        scrollEventThrottle={32}
        onScroll={(event) => {
          const visible = event.nativeEvent.contentOffset.y > TITLE_THRESHOLD;
          if (visible !== titleVisible) setTitleVisible(visible);
        }}
      >
        <View style={styles.heading}>
          <Text variant="title" accessibilityRole="header">
            {data.title}
          </Text>
          <Text variant="caption" tone="muted">
            {meta}
          </Text>
        </View>

        {data.type === 'COMPLIANCE' && enrollment ? <CourseComplianceBanner course={enrollment} /> : null}

        <CourseSummary>
          <CourseSummaryProgress
            percent={outline.percent}
            label={t('completedOfTotal', { completed: outline.completed, total: outline.items.length })}
            detail={finished ? t('finishedEverything') : resume ? t('nextItem', { title: resume.title }) : undefined}
          />
          <CourseDownloadStatus courseId={courseId} />
          <CourseSummaryActions>
            {resume ? (
              <Button size="lg" onPress={() => openContentItem(courseId, resume)}>
                <ButtonText>{outline.completed > 0 ? common('continue') : t('startCourse')}</ButtonText>
                <ButtonIcon icon={ArrowRight} />
              </Button>
            ) : finished && firstItem ? (
              <Button size="lg" variant="outline" onPress={() => openContentItem(courseId, firstItem)}>
                <ButtonIcon icon={RotateCcw} />
                <ButtonText>{t('reviewCourse')}</ButtonText>
              </Button>
            ) : null}
          </CourseSummaryActions>
        </CourseSummary>

        <CourseLinks>
          <CourseLink
            icon={Megaphone}
            title={t('newsfeed')}
            description={t('newsfeedDescription')}
            onPress={() => router.push({ pathname: '/course/[courseId]/newsfeed', params: { courseId } })}
          />
          {data.certificate ? (
            <CourseLink
              icon={Award}
              title={t('certificate')}
              description={
                certificateEarnedAt
                  ? t('certificateEarnedOn', { date: formatDay(certificateEarnedAt, locale) })
                  : t('certificateOnFinish')
              }
              onPress={() => router.push({ pathname: '/certificates/[courseId]', params: { courseId } })}
            />
          ) : null}
        </CourseLinks>

        {outline.items.length === 0 ? (
          <Empty>
            <EmptyMedia icon={BookOpen} />
            <EmptyTitle>{t('noLessonsTitle')}</EmptyTitle>
            <EmptyDescription>{t('noLessonsDescription')}</EmptyDescription>
          </Empty>
        ) : (
          outline.sections.map((section) => {
            const done = section.items.filter((item) => item.isComplete).length;

            return (
              <OutlineSection key={section.id}>
                <OutlineSectionHeader
                  title={section.title ?? (outline.sections.length > 1 ? t('sectionMore') : t('sectionContent'))}
                  meta={`${done}/${section.items.length}`}
                />
                <OutlineList>
                  {section.items.map((item) => (
                    <CourseContentRow
                      key={item.id}
                      courseId={courseId}
                      item={item}
                      items={outline.items}
                      state={itemState(item, resume?.id ?? null)}
                      isLiveClass={isLiveClass}
                      offline={offline}
                      onOpen={(target) => openContentItem(courseId, target)}
                    />
                  ))}
                </OutlineList>
              </OutlineSection>
            );
          })
        )}
      </ScreenScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  heading: { gap: SPACING.xxs }
});
