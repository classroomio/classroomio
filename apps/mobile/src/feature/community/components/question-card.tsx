import { ArrowBigUp, MessageSquare } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

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
import { communityCatalog } from '@/feature/community/translations/catalog';
import type { CommunityQuestionSummary } from '@/feature/community/types/community';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type QuestionCardProps = { question: CommunityQuestionSummary; onPress: (question: CommunityQuestionSummary) => void };

export function QuestionCard({ question, onPress }: QuestionCardProps) {
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
    <Post onPress={() => onPress(question)} accessibilityLabel={label}>
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
        <PostAction icon={ArrowBigUp}>{votes}</PostAction>
        <PostAction icon={MessageSquare}>{answers}</PostAction>
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
