import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  useCohortCoursesQuery,
  useCohortGoalsQuery,
  useCohortPeopleCountQuery,
  useCohortQuery
} from '@/feature/cohort/api/cohort';
import { useCohortPostsQuery } from '@/feature/cohort/api/cohort-newsfeed';
import { useCohortsQuery } from '@/feature/cohort/api/cohorts';
import { CohortCourseCarousel } from '@/feature/cohort/components/cohort-course-carousel';
import { CohortGoalList } from '@/feature/cohort/components/cohort-goal-list';
import { CohortPost } from '@/feature/cohort/components/cohort-post';
import { CohortSkeleton } from '@/feature/cohort/components/cohort-skeleton';
import { cohortCourseEntries } from '@/feature/cohort/helpers/cohort-course-entries';
import { useCohortReactions } from '@/feature/cohort/helpers/use-cohort-reactions';
import { cohortCatalog } from '@/feature/cohort/translations/catalog';
import type { CohortPost as CohortPostData } from '@/feature/cohort/types/cohort';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useEnrolledCoursesQuery } from '@/feature/course/api/enrolled-courses';
import { AnimatedScreenScrollView } from '@/feature/course/components/animated-screen-scroll-view';
import { useScrollThreshold } from '@/feature/course/helpers/use-scroll-threshold';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const RECENT_ANNOUNCEMENTS = 3;
const HEADING_HEIGHT = 40;

export default function CohortScreen() {
  const { cohortId } = useLocalSearchParams<{ cohortId: string }>();
  const t = useTranslations(cohortCatalog);
  const common = useTranslations(commonCatalog);
  const offline = useIsOffline();
  const cohort = useCohortQuery(cohortId);
  const listed = useCohortsQuery().data?.find((candidate) => candidate.id === cohortId);
  const courses = useCohortCoursesQuery(cohortId);
  const enrolled = useEnrolledCoursesQuery();
  const goals = useCohortGoalsQuery(cohortId);
  const people = useCohortPeopleCountQuery(cohortId);
  const posts = useCohortPostsQuery(cohortId);
  const { memberId, react } = useCohortReactions(cohortId);
  const { onScroll, past } = useScrollThreshold(HEADING_HEIGHT);
  const name = cohort.data?.name ?? listed?.name ?? '';
  const description = cohort.data?.description ?? listed?.description;
  const entries = cohortCourseEntries(courses.data ?? [], enrolled.data ?? []);
  const allPosts = posts.data?.pages.flatMap((page) => page.items) ?? [];
  const recent = allPosts.slice(0, RECENT_ANNOUNCEMENTS);
  const moreAnnouncements = allPosts.length > RECENT_ANNOUNCEMENTS || Boolean(posts.hasNextPage);
  const meta = [
    courses.data ? t('courseCount', { count: courses.data.length }) : null,
    people.data !== undefined ? t('peopleCount', { count: people.data }) : null
  ]
    .filter(Boolean)
    .join(' · ');
  const loading = cohort.isPending || courses.isPending || goals.isPending;

  const openPost = (post: CohortPostData) =>
    router.push({ pathname: '/learn/cohorts/[cohortId]/[postId]', params: { cohortId, postId: post.id } });

  const refresh = () =>
    Promise.all([
      cohort.refetch(),
      courses.refetch(),
      enrolled.refetch(),
      goals.refetch(),
      people.refetch(),
      posts.refetch()
    ]);

  if (cohort.isError && !cohort.data) {
    return (
      <ScreenScrollView onRefresh={refresh}>
        <Stack.Screen options={{ title: name }} />
        <Empty>
          <EmptyMedia icon={UsersThreeIcon} />
          <EmptyTitle>{t('cohortLoadError')}</EmptyTitle>
          <EmptyDescription>{errorMessage(cohort.error)}</EmptyDescription>
          <EmptyContent>
            <Button variant="outline" onPress={() => cohort.refetch()}>
              <ButtonText>{common('retry')}</ButtonText>
            </Button>
          </EmptyContent>
        </Empty>
      </ScreenScrollView>
    );
  }

  return (
    <AnimatedScreenScrollView onRefresh={refresh} onScroll={onScroll} scrollEventThrottle={16}>
      <Stack.Screen options={{ title: past ? name : '' }} />

      {name || description || meta ? (
        <View style={styles.intro}>
          {name ? (
            <Text variant="display" accessibilityRole="header">
              {name}
            </Text>
          ) : null}
          {description ? (
            <Text variant="body" tone="body">
              {description}
            </Text>
          ) : null}
          {meta ? (
            <Text variant="captionStrong" tone="muted">
              {meta}
            </Text>
          ) : null}
        </View>
      ) : null}

      {loading ? <CohortSkeleton /> : null}

      {!loading && goals.data && goals.data.length > 0 ? (
        <ScreenSection>
          <ScreenSectionHeader title={t('goals')} />
          <CohortGoalList goals={goals.data} />
        </ScreenSection>
      ) : null}

      {!loading && entries.length > 0 ? (
        <ScreenSection>
          <ScreenSectionHeader title={t('courses')} />
          <CohortCourseCarousel entries={entries} />
        </ScreenSection>
      ) : null}

      {!loading && posts.data ? (
        <ScreenSection>
          <ScreenSectionHeader
            title={t('announcements')}
            action={
              moreAnnouncements ? (
                <Pressable
                  accessibilityRole="link"
                  hitSlop={HIT_SLOP}
                  onPress={() =>
                    router.push({ pathname: '/learn/cohorts/[cohortId]/announcements', params: { cohortId } })
                  }
                >
                  <Text variant="captionStrong" tone="primary">
                    {t('seeAll')}
                  </Text>
                </Pressable>
              ) : undefined
            }
          />
          {recent.length === 0 ? (
            <Text variant="caption" tone="muted">
              {t('noAnnouncementsDescription')}
            </Text>
          ) : (
            <View style={styles.posts}>
              {recent.map((post) => (
                <CohortPost
                  key={post.id}
                  post={post}
                  memberId={memberId}
                  disabled={offline}
                  onToggleReaction={react}
                  onOpen={openPost}
                />
              ))}
            </View>
          )}
        </ScreenSection>
      ) : null}
    </AnimatedScreenScrollView>
  );
}

const styles = StyleSheet.create({
  intro: { gap: SPACING.xs },
  posts: { gap: SPACING.sm }
});
