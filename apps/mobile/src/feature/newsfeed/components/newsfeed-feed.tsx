import { MegaphoneIcon } from 'phosphor-react-native/src/icons/Megaphone';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Banner, BannerContent, BannerDescription, BannerIcon, BannerTitle } from '@/feature/common/components/banner';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { OfflineNotice } from '@/feature/common/components/offline-notice';
import { ScreenScrollView } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Spinner } from '@/feature/common/components/spinner';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { useNewsfeedPostsQuery } from '@/feature/newsfeed/api/newsfeed-posts';
import { useToggleReactionMutation } from '@/feature/newsfeed/api/newsfeed-reaction';
import { useNewsfeedViewerQuery } from '@/feature/newsfeed/api/newsfeed-viewer';
import { orderPosts } from '@/feature/newsfeed/helpers/posts';
import { viewerReactionOf } from '@/feature/newsfeed/helpers/reactions';
import { newsfeedCatalog } from '@/feature/newsfeed/translations/catalog';
import type { NewsfeedPost as NewsfeedPostData, ReactionType } from '@/feature/newsfeed/types/newsfeed';

import { NewsfeedPost } from './newsfeed-post';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';

export function NewsfeedFeed({ courseId }: { courseId: string }) {
  const { org, isStaff } = useActiveOrg();
  const t = useTranslations(newsfeedCatalog);
  if (!isStaff && org?.customization?.course?.newsfeed === false) {
    return (
      <>
        <Stack.Screen options={{ title: t('screenTitleNewsfeed') }} />
        <ScreenScrollView>
          <Empty>
            <EmptyMedia icon={MegaphoneIcon} />
            <EmptyTitle>{t('turnedOffTitle')}</EmptyTitle>
            <EmptyDescription>{t('turnedOffDescription')}</EmptyDescription>
          </Empty>
        </ScreenScrollView>
      </>
    );
  }

  return <NewsfeedPosts courseId={courseId} />;
}

function NewsfeedPosts({ courseId }: { courseId: string }) {
  const { colors } = useTheme();
  const t = useTranslations(newsfeedCatalog);
  const tc = useTranslations(commonCatalog);
  const offline = useIsOffline();
  const posts = useNewsfeedPostsQuery(courseId);
  const viewer = useNewsfeedViewerQuery(courseId);
  const toggleReaction = useToggleReactionMutation(courseId);
  const items = orderPosts(posts.data?.pages.flatMap((page) => page.items) ?? []);
  const failedWithoutData = posts.isError && !posts.data;

  const openPost = (post: NewsfeedPostData) =>
    router.push({ pathname: '/course/[courseId]/newsfeed/[postId]', params: { courseId, postId: post.id } });

  const react = (post: NewsfeedPostData, type: ReactionType) =>
    toggleReaction.mutate(
      { postId: post.id, type, previous: post.reaction },
      {
        onError: (error) => showToast({ title: t('reactionFailed'), description: errorMessage(error), tone: 'danger' })
      }
    );

  const loadMore = () => {
    if (offline || !posts.hasNextPage || posts.isFetchingNextPage) return;

    void posts.fetchNextPage();
  };

  return (
    <>
      <Stack.Screen options={{ title: t('screenTitleNewsfeed') }} />
      <FlashList
        data={items}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => (
          <NewsfeedPost
            post={item}
            viewerReaction={viewerReactionOf(item.reaction, viewer.data?.groupMemberId)}
            reactionsDisabled={offline}
            onToggleReaction={react}
            onOpen={openPost}
          />
        )}
        ItemSeparatorComponent={Separator}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        ListHeaderComponent={
          <View style={styles.header}>
            {offline ? <OfflineNotice description={t('offlineFeed')} /> : null}
            {posts.isError && posts.data && !offline ? (
              <Banner tone="danger">
                <BannerIcon icon={WarningCircleIcon} />
                <BannerContent>
                  <BannerTitle>{t('refreshFailed')}</BannerTitle>
                  <BannerDescription>{errorMessage(posts.error)}</BannerDescription>
                </BannerContent>
              </Banner>
            ) : null}
          </View>
        }
        ListFooterComponent={
          posts.isFetchingNextPage ? (
            <View style={styles.footer}>
              <Spinner />
            </View>
          ) : null
        }
        ListEmptyComponent={
          posts.isPending && !failedWithoutData ? (
            <View style={styles.skeleton}>
              <Skeleton height={160} radius={RADII.xl} />
              <Skeleton height={160} radius={RADII.xl} />
            </View>
          ) : failedWithoutData ? (
            <Empty>
              <EmptyMedia icon={WarningCircleIcon} />
              <EmptyTitle>{t('loadFailed')}</EmptyTitle>
              <EmptyDescription>{errorMessage(posts.error)}</EmptyDescription>
              <EmptyContent>
                <Button variant="outline" onPress={() => posts.refetch()}>
                  <ButtonText>{tc('retry')}</ButtonText>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Empty>
              <EmptyMedia icon={MegaphoneIcon} />
              <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
            </Empty>
          )
        }
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<PullRefreshControl onRefresh={() => posts.refetch()} />}
        contentContainerStyle={styles.content}
        style={{ backgroundColor: colors.background }}
      />
    </>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  header: { gap: SPACING.sm, paddingBottom: SPACING.sm },
  separator: { height: SPACING.sm },
  skeleton: { gap: SPACING.sm },
  footer: { paddingVertical: SPACING.lg, alignItems: 'center' }
});
