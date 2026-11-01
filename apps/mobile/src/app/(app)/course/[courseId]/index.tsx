import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { MedalIcon } from 'phosphor-react-native/src/icons/Medal';
import { MegaphoneIcon } from 'phosphor-react-native/src/icons/Megaphone';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle
} from '@/feature/common/components/empty';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';
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
import {
  CourseHeaderBackdrop,
  CourseHero,
  CourseHeroMeta,
  CourseHeroSkeleton,
  CourseHeroTitle,
  useCourseHeroHeight
} from '@/feature/course/components/course-hero';
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

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const t = useTranslations(courseCatalog);
  const common = useTranslations(commonCatalog);
  const locale = useLocale();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { course, outline, enrollment } = useCourseOutline(courseId);
  const heroHeight = useCourseHeroHeight();
  const headerHeight = useHeaderHeight();
  const collapseAt = heroHeight - headerHeight;
  const { onScroll, offset, past } = useScrollThreshold(collapseAt);
  const offline = useIsOffline();
  const data = course.data;
  const title = data?.title ?? enrollment?.title;
  const bannerUri = data?.bannerImage || data?.logo || enrollment?.bannerImage || enrollment?.logo;
  const showsHero = course.isPending ? !offline : Boolean(data && outline);
  const themeStatusBar = isDark ? 'light' : 'dark';
  const typeKey = data ? courseTypeKey(data.type) : null;
  const meta = outline
    ? [
        typeKey ? t(typeKey) : null,
        t('lessonCount', { count: outline.lessonCount }),
        outline.exerciseCount > 0 ? t('exerciseCount', { count: outline.exerciseCount }) : null
      ]
        .filter(Boolean)
        .join(' · ')
    : null;

  useFocusEffect(
    useCallback(() => {
      if (!showsHero) return;

      setStatusBarStyle(past ? themeStatusBar : 'light', true);

      return () => setStatusBarStyle(themeStatusBar, true);
    }, [showsHero, past, themeStatusBar])
  );

  const header = (
    <Stack.Screen
      options={{
        headerTransparent: true,
        headerStyle: { backgroundColor: 'transparent' },
        headerLargeStyle: { backgroundColor: 'transparent' },
        title: past && title ? title : '',
        headerRight: data ? () => <CourseDownloadHeaderButton courseId={courseId} /> : undefined
      }}
    />
  );

  const heroScreen = (children: ReactNode, footer?: ReactNode) => (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {header}
      <AnimatedScreenScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        scrollEnabled={!course.isPending}
        contentInsetAdjustmentBehavior="never"
        scrollIndicatorInsets={{ top: headerHeight }}
        refreshControl={
          course.isPending ? undefined : (
            <PullRefreshControl onRefresh={() => course.refetch()} tintColor={colors.onSolid} />
          )
        }
        contentContainerStyle={[styles.content, { paddingBottom: (footer ? 0 : insets.bottom) + SPACING.xxxl }]}
      >
        <CourseHero uri={bannerUri} scrollOffset={offset} collapseAt={collapseAt}>
          {title ? (
            <>
              {meta ? <CourseHeroMeta>{meta}</CourseHeroMeta> : null}
              <CourseHeroTitle>{title}</CourseHeroTitle>
            </>
          ) : (
            <CourseHeroSkeleton />
          )}
        </CourseHero>
        {children}
      </AnimatedScreenScrollView>
      <CourseHeaderBackdrop scrollOffset={offset} collapseAt={collapseAt} />
      {footer}
    </View>
  );

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

  if (course.isPending) return heroScreen(<CourseDetailSkeleton />);

  if (!data || !outline) {
    return (
      <>
        {header}
        <AnimatedScreenScrollView onRefresh={() => course.refetch()}>
          <Empty>
            <EmptyMedia icon={BookOpenIcon} />
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
  const finished = outline.items.length > 0 && outline.completed === outline.items.length;
  const resume = outline.current;
  const firstItem = outline.items[0] ?? null;
  const certificateEarnedAt = enrollment?.certificateEarnedAt ?? null;

  const primaryAction = resume ? (
    <Button size="lg" onPress={() => openContentItem(courseId, resume)}>
      <ButtonText>{outline.completed > 0 ? common('continue') : t('startCourse')}</ButtonText>
      <ButtonIcon icon={ArrowRightIcon} />
    </Button>
  ) : finished && firstItem ? (
    <Button size="lg" variant="outline" onPress={() => openContentItem(courseId, firstItem)}>
      <ButtonIcon icon={ArrowCounterClockwiseIcon} />
      <ButtonText>{t('reviewCourse')}</ButtonText>
    </Button>
  ) : null;

  return heroScreen(
    <>
      {data.type === 'COMPLIANCE' && enrollment ? <CourseComplianceBanner course={enrollment} /> : null}

      <CourseSummary>
        <CourseSummaryProgress
          percent={outline.percent}
          label={t('completedOfTotal', { completed: outline.completed, total: outline.items.length })}
          detail={finished ? t('finishedEverything') : resume ? t('nextItem', { title: resume.title }) : undefined}
          finished={finished}
        />
        <CourseDownloadStatus courseId={courseId} />
      </CourseSummary>

      <CourseLinks>
        <CourseLink
          icon={MegaphoneIcon}
          title={t('newsfeed')}
          description={t('newsfeedDescription')}
          onPress={() => router.push({ pathname: '/course/[courseId]/newsfeed', params: { courseId } })}
        />
        {data.certificate ? (
          <CourseLink
            icon={MedalIcon}
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
          <EmptyMedia icon={BookOpenIcon} />
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
                meta={t('completedOfTotal', { completed: done, total: section.items.length })}
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
    </>,
    primaryAction ? <CourseActionBar>{primaryAction}</CourseActionBar> : null
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingTop: 0 }
});
