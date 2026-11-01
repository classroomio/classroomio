import { ArrowFatUpIcon } from 'phosphor-react-native/src/icons/ArrowFatUp';
import { ChatIcon } from 'phosphor-react-native/src/icons/Chat';
import { Link } from 'expo-router';
import { StyleSheet, View, type PressableProps } from 'react-native';

import {
  Post,
  PostAction,
  PostActions,
  PostAuthor,
  PostAuthorName,
  PostAvatar,
  PostHeader,
  PostMeta,
  PostTitle
} from '@/feature/common/components/post';
import { Text } from '@/feature/common/components/text';
import { timeAgo } from '@/feature/common/helpers/time-ago';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type { CommunityQuestionSummary } from '@/feature/community/types/community';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { useQuestionActions } from './question-actions';

type QuestionCardProps = { question: CommunityQuestionSummary; onPress: (question: CommunityQuestionSummary) => void };

export function QuestionCard({ question, onPress }: QuestionCardProps) {
  const t = useTranslations(communityCatalog);
  const tc = useTranslations(commonCatalog);
  const actions = useQuestionActions();
  if (!actions || !question.slug) return <QuestionCardContent question={question} onPress={() => onPress(question)} />;

  const voted = actions.isVoted(question);
  const manage = actions.canManage(question);
  const link = actions.linkOf(question);

  return (
    <Link href={{ pathname: '/community/[slug]', params: { slug: question.slug } }} asChild>
      <Link.Trigger>
        <QuestionCardContent question={question} />
      </Link.Trigger>
      <Link.Preview />
      <Link.Menu>
        <Link.MenuAction icon="arrow.up.forward" onPress={() => actions.open(question)}>
          {tc('open')}
        </Link.MenuAction>
        <Link.MenuAction
          icon={voted ? 'arrowshape.up.fill' : 'arrowshape.up'}
          isOn={voted}
          disabled={!actions.canUpvote(question)}
          onPress={() => actions.upvote(question)}
        >
          {voted ? t('upvoted') : t('upvote')}
        </Link.MenuAction>
        <Link.MenuAction icon="link" hidden={!link} onPress={() => actions.copyLink(question)}>
          {t('copyLink')}
        </Link.MenuAction>
        <Link.MenuAction
          icon="pencil"
          hidden={!manage}
          disabled={actions.offline}
          onPress={() => actions.edit(question)}
        >
          {t('editQuestion')}
        </Link.MenuAction>
        <Link.MenuAction
          icon="trash"
          destructive
          hidden={!manage}
          disabled={actions.offline}
          onPress={() => actions.remove(question)}
        >
          {t('deleteQuestion')}
        </Link.MenuAction>
      </Link.Menu>
    </Link>
  );
}

type QuestionCardContentProps = {
  question: CommunityQuestionSummary;
  /** Supplied by `Link.Trigger` when the card is a link. */
  onPress?: PressableProps['onPress'];
};

function QuestionCardContent({ question, onPress }: QuestionCardContentProps) {
  const t = useTranslations(communityCatalog);
  const locale = useLocale();
  const author = question.authorFullname || t('formerMember');
  const answers = Number(question.comments) || 0;
  const votes = question.votes ?? 0;
  const counts = { upvotes: t('upvoteCount', { count: votes }), answers: t('answerCount', { count: answers }) };
  const label = question.courseTitle
    ? t('questionCardLabel', { title: question.title, author, course: question.courseTitle, ...counts })
    : t('questionCardLabelNoCourse', { title: question.title, author, ...counts });

  return (
    <Post onPress={onPress} accessibilityLabel={label}>
      <PostHeader>
        <PostAvatar name={author} />
        <PostAuthor>
          <PostAuthorName>{author}</PostAuthorName>
          <PostMeta>
            {[question.courseTitle, timeAgo(question.createdAt, undefined, locale)].filter(Boolean).join(' · ')}
          </PostMeta>
        </PostAuthor>
      </PostHeader>
      <PostTitle numberOfLines={3}>{question.title}</PostTitle>
      <PostActions>
        <PostAction icon={ArrowFatUpIcon}>{votes}</PostAction>
        <PostAction icon={ChatIcon}>{answers}</PostAction>
        {answers === 0 ? (
          <View style={styles.status}>
            <Text variant="caption" tone="muted">
              {t('noAnswersYet')}
            </Text>
          </View>
        ) : null}
      </PostActions>
    </Post>
  );
}

const styles = StyleSheet.create({
  status: { marginLeft: 'auto' }
});
