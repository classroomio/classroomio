import { MegaphoneIcon } from 'phosphor-react-native/src/icons/Megaphone';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useCohortPostsQuery } from '@/feature/cohort/api/cohort-newsfeed';
import { CohortPost } from '@/feature/cohort/components/cohort-post';
import { useCohortReactions } from '@/feature/cohort/helpers/use-cohort-reactions';
import { cohortCatalog } from '@/feature/cohort/translations/catalog';
import type { CohortPost as CohortPostData } from '@/feature/cohort/types/cohort';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Spinner } from '@/feature/common/components/spinner';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function CohortAnnouncementsScreen() {
  const { cohortId } = useLocalSearchParams<{ cohortId: string }>();
  const t = useTranslations(cohortCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const offline = useIsOffline();
  const posts = useCohortPostsQuery(cohortId);
  const { memberId, react } = useCohortReactions(cohortId);
  const items = posts.data?.pages.flatMap((page) => page.items) ?? [];

  const openPost = (post: CohortPostData) =>
    router.push({ pathname: '/learn/cohorts/[cohortId]/[postId]', params: { cohortId, postId: post.id } });

  const loadMore = () => {
    if (offline || !posts.hasNextPage || posts.isFetchingNextPage) return;

    void posts.fetchNextPage();
  };

  return (
    <FlashList
      data={items}
      keyExtractor={(post) => post.id}
      renderItem={({ item }) => (
        <CohortPost post={item} memberId={memberId} disabled={offline} onToggleReaction={react} onOpen={openPost} />
      )}
      ItemSeparatorComponent={Separator}
      onEndReached={loadMore}
      onEndReachedThreshold={0.6}
      ListFooterComponent={
        posts.isFetchingNextPage ? (
          <View style={styles.footer}>
            <Spinner />
          </View>
        ) : null
      }
      ListEmptyComponent={
        posts.isPending ? (
          <View style={styles.skeleton}>
            <Skeleton height={160} radius={RADII.xl} />
            <Skeleton height={160} radius={RADII.xl} />
          </View>
        ) : posts.isError ? (
          <Empty>
            <EmptyMedia icon={WarningCircleIcon} />
            <EmptyTitle>{t('announcementsLoadError')}</EmptyTitle>
            <EmptyDescription>{errorMessage(posts.error)}</EmptyDescription>
            <EmptyContent>
              <Button variant="outline" onPress={() => posts.refetch()}>
                <ButtonText>{common('retry')}</ButtonText>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Empty>
            <EmptyMedia icon={MegaphoneIcon} />
            <EmptyTitle>{t('noAnnouncementsTitle')}</EmptyTitle>
            <EmptyDescription>{t('noAnnouncementsDescription')}</EmptyDescription>
          </Empty>
        )
      }
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<PullRefreshControl onRefresh={() => posts.refetch()} />}
      contentContainerStyle={styles.content}
      style={{ backgroundColor: colors.background }}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  separator: { height: SPACING.sm },
  skeleton: { gap: SPACING.sm },
  footer: { paddingVertical: SPACING.lg, alignItems: 'center' }
});
