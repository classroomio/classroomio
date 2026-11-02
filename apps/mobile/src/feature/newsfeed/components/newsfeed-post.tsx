import { ChatIcon } from 'phosphor-react-native/src/icons/Chat';
import { PushPinIcon } from 'phosphor-react-native/src/icons/PushPin';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import {
  Post,
  PostAction,
  PostActions,
  PostAuthor,
  PostAuthorName,
  PostAvatar,
  PostBody,
  PostHeader,
  PostHeaderAction,
  PostMeta
} from '@/feature/common/components/post';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { timeAgo } from '@/feature/common/helpers/time-ago';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { reactionRecordOf } from '@/feature/newsfeed/helpers/reactions';
import { newsfeedCatalog } from '@/feature/newsfeed/translations/catalog';
import type { NewsfeedPost as NewsfeedPostData, ReactionType } from '@/feature/newsfeed/types/newsfeed';

import { Reactions, ReactionsPicker, ReactionsSummary } from './reactions';

type NewsfeedPostProps = {
  post: NewsfeedPostData;
  viewerReaction: ReactionType | null;
  reactionsDisabled: boolean;
  onToggleReaction: (post: NewsfeedPostData, type: ReactionType) => void;
  /** Opens the post with its comments. Omit on the post's own screen. */
  onOpen?: (post: NewsfeedPostData) => void;
  variant?: 'card' | 'plain';
};

export function NewsfeedPost({
  post,
  viewerReaction,
  reactionsDisabled,
  onToggleReaction,
  onOpen,
  variant = 'card'
}: NewsfeedPostProps) {
  const t = useTranslations(newsfeedCatalog);
  const locale = useLocale();
  const author = post.authorFullname || null;
  const comments = post.commentCount ?? 0;

  return (
    <Post
      variant={variant}
      onPress={onOpen ? () => onOpen(post) : undefined}
      accessibilityLabel={onOpen ? (author ? t('postBy', { author }) : t('postByCourseTeam')) : undefined}
    >
      <PostHeader>
        <PostAvatar name={author ?? t('courseTeam')} uri={post.authorAvatarUrl} />
        <PostAuthor>
          <PostAuthorName>{author ?? t('courseTeam')}</PostAuthorName>
          <PostMeta>{timeAgo(post.createdAt, undefined, locale)}</PostMeta>
        </PostAuthor>
        {post.isPinned ? (
          <PostHeaderAction>
            <View style={styles.pinned} accessibilityLabel={t('pinnedPost')}>
              <Icon icon={PushPinIcon} size={14} tone="primary" />
              <Text variant="captionStrong" tone="primary">
                {t('pinned')}
              </Text>
            </View>
          </PostHeaderAction>
        ) : null}
      </PostHeader>
      <PostBody html={post.content} />
      <PostActions>
        <Reactions
          record={reactionRecordOf(post.reaction)}
          selected={viewerReaction}
          disabled={reactionsDisabled}
          onToggle={(type) => onToggleReaction(post, type)}
        >
          <ReactionsSummary />
          <ReactionsPicker />
        </Reactions>
        <View style={styles.comments}>
          <PostAction
            icon={ChatIcon}
            onPress={onOpen ? () => onOpen(post) : undefined}
            accessibilityLabel={t('commentCount', { count: comments })}
          >
            {comments}
          </PostAction>
        </View>
      </PostActions>
    </Post>
  );
}

const styles = StyleSheet.create({
  pinned: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs },
  comments: { marginLeft: 'auto' }
});
