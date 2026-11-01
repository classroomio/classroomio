import { ArrowFatUpIcon } from 'phosphor-react-native/src/icons/ArrowFatUp';
import { BellSimpleIcon } from 'phosphor-react-native/src/icons/BellSimple';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { EyeSlashIcon } from 'phosphor-react-native/src/icons/EyeSlash';
import { StyleSheet, View } from 'react-native';

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
import { SPACING } from '@/feature/common/constants/layout';
import { timeAgo } from '@/feature/common/helpers/time-ago';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type { CommunityAnswer, CommunityQuestion } from '@/feature/community/types/community';
import type { Translator } from '@/feature/i18n/helpers/translate';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { QuestionStatus } from './question-status';

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
        {question.isFollowing ? (
          <View style={styles.trailing}>
            <QuestionStatus icon={BellSimpleIcon} tone="muted">
              {t('following')}
            </QuestionStatus>
          </View>
        ) : null}
      </PostActions>
    </Post>
  );
}

type AnswerPostProps = VoteProps & { answer: CommunityAnswer; accepted: boolean; onOpenMenu?: () => void };

export function AnswerPost({ answer, accepted, voted, disabled, onUpvote, onOpenMenu }: AnswerPostProps) {
  const t = useTranslations(communityCatalog);
  const { colors } = useTheme();
  const locale = useLocale();
  const author = answer.author.fullname || t('formerMember');
  const votes = answer.votes ?? 0;

  return (
    <Post
      density="compact"
      style={[
        accepted && { borderColor: colors.success },
        answer.isHidden && { backgroundColor: colors.muted, shadowOpacity: 0 }
      ]}
    >
      {accepted || answer.isHidden ? (
        <View style={styles.statuses}>
          {accepted ? (
            <QuestionStatus icon={CheckCircleIcon} tone="success">
              {t('acceptedAnswer')}
            </QuestionStatus>
          ) : null}
          {answer.isHidden ? (
            <QuestionStatus icon={EyeSlashIcon} tone="warning">
              {t('hiddenFromLearners')}
            </QuestionStatus>
          ) : null}
        </View>
      ) : null}
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

const styles = StyleSheet.create({
  trailing: { flex: 1, alignItems: 'flex-end' },
  statuses: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACING.md }
});
