import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { MessageCircle, RefreshCw } from 'lucide-react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import {
  Post,
  PostAuthor,
  PostAuthorName,
  PostAvatar,
  PostBody,
  PostHeader,
  PostMeta
} from '@/feature/common/components/post';
import { ScreenScrollView, ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { usePostCommentsQuery } from '@/feature/teach/api/course-newsfeed';
import { teachKeys, useTeachScope } from '@/feature/teach/api/teach-scope';
import { FeedComment } from '@/feature/teach/components/feed-comment';
import { inThreadOrder } from '@/feature/teach/helpers/comment-thread';
import { AGO_KEYS, elapsedCopy } from '@/feature/teach/helpers/relative-time';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { NewsfeedPage } from '@/feature/teach/types/teach';

function useCachedPost(courseId: string, feedId: string) {
  const queryClient = useQueryClient();
  const { userId, orgId } = useTeachScope();
  const feed = queryClient.getQueryData<InfiniteData<NewsfeedPage, string | null>>(
    teachKeys.newsfeed(userId, orgId, courseId)
  );

  return feed?.pages.flatMap((page) => page.items).find((item) => item.id === feedId) ?? null;
}

export default function PostCommentsScreen() {
  const t = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const { courseId = '', feedId = '' } = useLocalSearchParams<{ courseId: string; feedId: string }>();
  const post = useCachedPost(courseId, feedId);
  const comments = usePostCommentsQuery(courseId, feedId);
  const items = inThreadOrder(comments.data?.items ?? []);
  const total = comments.data?.totalCommentCount ?? 0;
  const author = post?.authorFullname || post?.authorUsername || t('courseTeam');

  return (
    <ScreenScrollView refreshing={comments.isRefetching} onRefresh={() => comments.refetch()}>
      {post && (
        <Post>
          <PostHeader>
            <PostAvatar name={author} uri={post.authorAvatarUrl} />
            <PostAuthor>
              <PostAuthorName>{author}</PostAuthorName>
              <PostMeta>{elapsedCopy(t, AGO_KEYS, post.createdAt)}</PostMeta>
            </PostAuthor>
          </PostHeader>
          <PostBody html={post.content} />
        </Post>
      )}

      <ScreenSection>
        <ScreenSectionHeader
          title={t('comments')}
          action={
            comments.isSuccess ? (
              <Text variant="caption" tone="muted">
                {total}
              </Text>
            ) : undefined
          }
        />
        {comments.isPending && <Skeleton height={200} radius={14} />}
        {comments.isError && (
          <Empty>
            <EmptyMedia icon={MessageCircle} />
            <EmptyTitle>{t('commentsLoadError')}</EmptyTitle>
            <EmptyDescription>{errorMessage(comments.error)}</EmptyDescription>
            <EmptyContent>
              <Button variant="outline" onPress={() => comments.refetch()}>
                <ButtonIcon icon={RefreshCw} />
                <ButtonText>{common('retry')}</ButtonText>
              </Button>
            </EmptyContent>
          </Empty>
        )}
        {comments.isSuccess && items.length === 0 && (
          <Empty>
            <EmptyMedia icon={MessageCircle} />
            <EmptyTitle>{t('noCommentsTitle')}</EmptyTitle>
            <EmptyDescription>{t('noCommentsDescription')}</EmptyDescription>
          </Empty>
        )}
        {items.map((comment) => (
          <FeedComment key={comment.id} courseId={courseId} feedId={feedId} comment={comment} />
        ))}
        {comments.data?.hasMore && (
          <Text variant="caption" tone="muted">
            {t('showingNewest', { shown: items.length, count: total })}
          </Text>
        )}
      </ScreenSection>
    </ScreenScrollView>
  );
}
