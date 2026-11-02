import { ChatIcon } from 'phosphor-react-native/src/icons/Chat';
import { PushPinIcon } from 'phosphor-react-native/src/icons/PushPin';
import { StyleSheet, View } from 'react-native';

import { cohortCatalog } from '@/feature/cohort/translations/catalog';
import type { CohortPost as CohortPostData } from '@/feature/cohort/types/cohort';
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
import { Reactions, ReactionsPicker, ReactionsSummary } from '@/feature/newsfeed/components/reactions';
import { reactionRecordOf, viewerReactionOf } from '@/feature/newsfeed/helpers/reactions';
import type { ReactionType } from '@/feature/newsfeed/types/newsfeed';

type CohortPostProps = {
  post: CohortPostData;
  /** The viewer's cohort membership id; reactions are disabled without one. */
  memberId: string | null;
  disabled: boolean;
  onToggleReaction: (post: CohortPostData, type: ReactionType) => void;
  /** Opens the announcement with its comments. Omit on the announcement's own screen. */
  onOpen?: (post: CohortPostData) => void;
  variant?: 'card' | 'plain';
};

/** A cohort announcement with its author, reactions and comment count. */
export function CohortPost({ post, memberId, disabled, onToggleReaction, onOpen, variant = 'card' }: CohortPostProps) {
  const t = useTranslations(cohortCatalog);
  const locale = useLocale();
  const author = post.authorFullname || t('cohortTeam');
  const comments = post.commentCount ?? 0;

  return (
    <Post
      variant={variant}
      onPress={onOpen ? () => onOpen(post) : undefined}
      accessibilityLabel={onOpen ? t('announcementBy', { author }) : undefined}
    >
      <PostHeader>
        <PostAvatar name={author} uri={post.authorAvatarUrl} />
        <PostAuthor>
          <PostAuthorName>{author}</PostAuthorName>
          <PostMeta>{timeAgo(post.createdAt, undefined, locale)}</PostMeta>
        </PostAuthor>
        {post.isPinned ? (
          <PostHeaderAction>
            <View style={styles.pinned}>
              <Icon icon={PushPinIcon} size={14} tone="primary" />
              <Text variant="captionStrong" tone="primary">
                {t('pinned')}
              </Text>
            </View>
          </PostHeaderAction>
        ) : null}
      </PostHeader>
      <PostBody html={post.content ?? ''} />
      <PostActions>
        <Reactions
          record={reactionRecordOf(post.reaction)}
          selected={viewerReactionOf(post.reaction, memberId)}
          disabled={disabled || !memberId}
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
