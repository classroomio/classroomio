import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Award, BookOpen, Megaphone, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle
} from '@/feature/common/components/empty';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { AnimatedScreenScrollView } from '@/feature/course/components/animated-screen-scroll-view';
import { CourseActionBar } from '@/feature/course/components/course-action-bar';
import { CourseComplianceBanner } from '@/feature/course/components/course-compliance-banner';
import { CourseContentRow } from '@/feature/course/components/course-content-row';
import { CourseDetailSkeleton } from '@/feature/course/components/course-detail-skeleton';
import { CourseHero } from '@/feature/course/components/course-hero';
import { CourseLink, CourseLinks } from '@/feature/course/components/course-links';
import { OutlineList, OutlineSection, OutlineSectionHeader } from '@/feature/course/components/course-outline';
import { CourseSummary, CourseSummaryProgress } from '@/feature/course/components/course-summary';
import { courseTypeKey } from '@/feature/course/constants/course-type';
import { itemState } from '@/feature/course/helpers/course-content';
import { formatDay } from '@/feature/course/helpers/format-date';
import { openContentItem } from '@/feature/course/helpers/open-content';
import { useCourseOutline } from '@/feature/course/helpers/use-course-outline';
import { useScrollThreshold } from '@/feature/course/helpers/use-scroll-threshold';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { CourseDownloadStatus } from '@/feature/downloads/components/course-download-status';
import { CourseDownloadHeaderButton } from '@/feature/downloads/components/download-header-button';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const TITLE_LINE = 28;

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const t = useTranslations(courseCatalog);
  const common = useTranslations(commonCatalog);
  const locale = useLocale();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { course, outline, enrollment } = useCourseOutline(courseId);
  const [titleThreshold, setTitleThreshold] = useState(Math.round((width * 9) / 16) + TITLE_LINE);
  const { onScroll, offset, past } = useScrollThreshold(titleThreshold);
  const offline = useIsOffline();
  const data = course.data;
  const bannerUri = data?.bannerImage || data?.logo || enrollment?.bannerImage || enrollment?.logo;

  const header = (
    <Stack.Screen
      options={{
        title: past && data ? data.title : '',
        headerRight: data ? () => <CourseDownloadHeaderButton courseId={courseId} /> : undefined
      }}
    />
  );
  const hero = <CourseHero uri={bannerUri} scrollOffset={offset} />;

  if (course.isPending && offline) {
    return (
      <>
        {header}
        <AnimatedScreenScrollView>
          <Empty>
            <EmptyIllustration name="offline" />
            <EmptyTitle>{t('courseNeedsConnectionTitle')}</EmptyTitle>
            <EmptyDescription>{t('courseNeedsConnectionDescription')}</EmptyDescription>
            <EmptyContent>
              <Button variant="outline" onPress={() => course.refetch()}>
                <ButtonText>{common('retry')}</ButtonText>
              </Button>
            </EmptyContent>
          </Empty>
        </AnimatedScreenScrollView>
      </>
    );
  }

  if (course.isPending) {
    return (
      <>
        {header}
        <AnimatedScreenScrollView scrollEnabled={false}>
          {hero}
          <CourseDetailSkeleton />
        </AnimatedScreenScrollView>
      </>
    );
  }

  if (!data || !outline) {
    return (
      <>
        {header}
        <AnimatedScreenScrollView refreshing={course.isRefetching} onRefresh={() => course.refetch()}>
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
        </AnimatedScreenScrollView>
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

  const primaryAction = resume ? (
    <Button size="lg" onPress={() => openContentItem(courseId, resume)}>
      <ButtonText>{outline.completed > 0 ? common('continue') : t('startCourse')}</ButtonText>
      <ButtonIcon icon={ArrowRight} />
    </Button>
  ) : finished && firstItem ? (
    <Button size="lg" variant="outline" onPress={() => openContentItem(courseId, firstItem)}>
      <ButtonIcon icon={RotateCcw} />
      <ButtonText>{t('reviewCourse')}</ButtonText>
    </Button>
  ) : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {header}
      <AnimatedScreenScrollView
        refreshing={course.isRefetching}
        onRefresh={() => course.refetch()}
        scrollEventThrottle={16}
        onScroll={onScroll}
      >
        {hero}

        <View style={styles.heading} onLayout={(event) => setTitleThreshold(event.nativeEvent.layout.y + TITLE_LINE)}>
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
      </AnimatedScreenScrollView>
      {primaryAction ? <CourseActionBar>{primaryAction}</CourseActionBar> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heading: { gap: SPACING.xxs }
});
