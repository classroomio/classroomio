import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';
import { SkeletonGroup, SkeletonText } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { AnimatedScreenScrollView } from '@/feature/course/components/animated-screen-scroll-view';
import { CourseActionBar } from '@/feature/course/components/course-action-bar';
import {
  CourseHeaderBackdrop,
  CourseHero,
  CourseHeroMeta,
  CourseHeroSkeleton,
  CourseHeroTitle,
  useCourseHeroHeight
} from '@/feature/course/components/course-hero';
import { courseTypeKey } from '@/feature/course/constants/course-type';
import { useScrollThreshold } from '@/feature/course/helpers/use-scroll-threshold';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { useEnrollMutation } from '@/feature/explore/api/enroll';
import { useExploreCourseQuery, useExploreCourseSummary } from '@/feature/explore/api/explore-courses';
import { ExploreCourseSection, ExploreCourseSectionHtml } from '@/feature/explore/components/explore-course-section';
import { ExploreEnrollAction } from '@/feature/explore/components/explore-enroll-action';
import { enrollErrorMessage } from '@/feature/explore/helpers/enroll-error';
import { exploreCatalog } from '@/feature/explore/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';

function hasText(html: string | null | undefined): html is string {
  return Boolean(html && html.replace(/<[^>]*>/g, '').trim());
}

export default function ExploreCourseScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const t = useTranslations(exploreCatalog);
  const tc = useTranslations(courseCatalog);
  const common = useTranslations(commonCatalog);
  const { colors, isDark } = useTheme();
  const offline = useIsOffline();
  const course = useExploreCourseQuery(courseId);
  const summary = useExploreCourseSummary(courseId);
  const enroll = useEnrollMutation(courseId);
  const heroHeight = useCourseHeroHeight();
  const headerHeight = useHeaderHeight();
  const collapseAt = heroHeight - headerHeight;
  const { onScroll, offset, past } = useScrollThreshold(collapseAt);
  const data = course.data;
  const title = data?.title ?? summary?.title;
  const bannerUri = data?.bannerImage ?? summary?.bannerImage ?? summary?.logo;
  const themeStatusBar = isDark ? 'light' : 'dark';
  const showsHero = Boolean(data) || course.isPending;
  const source = data ?? summary;
  const typeKey = source ? courseTypeKey(source.type) : null;
  const meta = source
    ? [
        typeKey ? tc(typeKey) : null,
        tc('lessonCount', { count: source.lessonCount }),
        source.exerciseCount > 0 ? tc('exerciseCount', { count: source.exerciseCount }) : null
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

  const openCourse = () => router.push({ pathname: '/course/[courseId]', params: { courseId } });

  const startEnroll = () =>
    enroll.mutate(undefined, {
      onSuccess: () => {
        showToast({ tone: 'success', title: t('enrolledToast', { title: title ?? '' }) });
        openCourse();
      },
      onError: (error) =>
        showToast({ tone: 'danger', title: t('enrollFailed'), description: enrollErrorMessage(error, t) })
    });

  if (!showsHero) {
    return (
      <>
        <Stack.Screen options={{ title: '' }} />
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

  const description = data?.description ?? summary?.description;
  const overview = data?.overview;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: past && title ? title : '' }} />
      <AnimatedScreenScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        scrollIndicatorInsets={{ top: headerHeight }}
        refreshControl={<PullRefreshControl onRefresh={() => course.refetch()} tintColor={colors.onSolid} />}
        contentContainerStyle={styles.content}
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

        {description ? (
          <Text variant="body" tone="body">
            {description}
          </Text>
        ) : null}

        {!data ? (
          <SkeletonGroup style={styles.skeleton}>
            <SkeletonText variant="subheading" lines={1} width="45%" />
            <SkeletonText variant="body" lines={4} />
          </SkeletonGroup>
        ) : null}

        {hasText(overview) ? (
          <ExploreCourseSection title={t('about')}>
            <ExploreCourseSectionHtml html={overview} />
          </ExploreCourseSection>
        ) : null}

        {hasText(data?.goals) ? (
          <ExploreCourseSection title={t('goals')}>
            <ExploreCourseSectionHtml html={data.goals} />
          </ExploreCourseSection>
        ) : null}

        {hasText(data?.requirements) ? (
          <ExploreCourseSection title={t('requirements')}>
            <ExploreCourseSectionHtml html={data.requirements} />
          </ExploreCourseSection>
        ) : null}
      </AnimatedScreenScrollView>
      <CourseHeaderBackdrop scrollOffset={offset} collapseAt={collapseAt} />
      {data ? (
        <CourseActionBar>
          <ExploreEnrollAction
            course={data}
            enrolling={enroll.isPending}
            disabled={offline}
            onEnroll={startEnroll}
            onOpenCourse={openCourse}
          />
        </CourseActionBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingTop: 0, paddingBottom: SPACING.xxxl },
  skeleton: { gap: SPACING.sm }
});
