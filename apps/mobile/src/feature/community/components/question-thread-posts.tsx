import { ArrowFatUpIcon } from 'phosphor-react-native/src/icons/ArrowFatUp';

import {
  Post,
  PostAction,
  PostActions,
  PostAuthor,
  PostAuthorName,
  PostAvatar,
  PostBody,
  PostHeader,
  PostMenuButton,
  PostMeta,
  PostTitle
} from '@/feature/common/components/post';
import { timeAgo } from '@/feature/common/helpers/time-ago';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type { CommunityAnswer, CommunityQuestion } from '@/feature/community/types/community';
import type { Translator } from '@/feature/i18n/helpers/translate';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type VoteProps = { voted: boolean; disabled: boolean; onUpvote: () => void };

function upvoteLabel(t: Translator<(typeof communityCatalog)['en']>, votes: number, voted: boolean) {
  const upvotes = t('upvoteCount', { count: votes });

  return voted ? t('upvotedLabel', { upvotes }) : t('upvoteLabel', { upvotes });
}

type QuestionPostProps = VoteProps & { question: CommunityQuestion; onOpenMenu?: () => void };

export function QuestionPost({ question, voted, disabled, onUpvote, onOpenMenu }: QuestionPostProps) {
  const t = useTranslations(communityCatalog);
  const locale = useLocale();
  const author = question.authorFullname || t('formerMember');
  const votes = question.votes ?? 0;

  return (
    <Post variant="plain">
      <PostHeader>
        <PostAvatar name={author} uri={question.authorAvatarUrl} />
        <PostAuthor>
          <PostAuthorName>{author}</PostAuthorName>
          <PostMeta>
            {[question.courseTitle, timeAgo(question.createdAt, undefined, locale)].filter(Boolean).join(' · ')}
          </PostMeta>
        </PostAuthor>
        {onOpenMenu ? <PostMenuButton onPress={onOpenMenu} accessibilityLabel={t('questionActions')} /> : null}
      </PostHeader>
      <PostTitle>{question.title}</PostTitle>
      <PostBody html={question.body} />
      <PostActions>
        <PostAction
          icon={ArrowFatUpIcon}
          active={voted}
          disabled={disabled || voted}
          onPress={onUpvote}
          accessibilityLabel={upvoteLabel(t, votes, voted)}
        >
          {votes}
        </PostAction>
      </PostActions>
    </Post>
  );
}

type AnswerPostProps = VoteProps & { answer: CommunityAnswer; onOpenMenu?: () => void };

export function AnswerPost({ answer, voted, disabled, onUpvote, onOpenMenu }: AnswerPostProps) {
  const t = useTranslations(communityCatalog);
  const locale = useLocale();
  const author = answer.author.fullname || t('formerMember');
  const votes = answer.votes ?? 0;

  return (
    <Post density="compact">
      <PostHeader>
        <PostAvatar name={author} uri={answer.author.avatarUrl} />
        <PostAuthor>
          <PostAuthorName>{author}</PostAuthorName>
          <PostMeta>{timeAgo(answer.createdAt, undefined, locale)}</PostMeta>
        </PostAuthor>
        {onOpenMenu ? <PostMenuButton onPress={onOpenMenu} accessibilityLabel={t('answerActions')} /> : null}
      </PostHeader>
      <PostBody html={answer.body} />
      <PostActions>
        <PostAction
          icon={ArrowFatUpIcon}
          active={voted}
          disabled={disabled || voted}
          onPress={onUpvote}
          accessibilityLabel={upvoteLabel(t, votes, voted)}
        >
          {votes}
        </PostAction>
      </PostActions>
    </Post>
  );
}
