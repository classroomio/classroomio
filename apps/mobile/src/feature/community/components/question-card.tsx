import { ArrowFatUpIcon } from 'phosphor-react-native/src/icons/ArrowFatUp';
import { BellSimpleIcon } from 'phosphor-react-native/src/icons/BellSimple';
import { ChatIcon } from 'phosphor-react-native/src/icons/Chat';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { EyeSlashIcon } from 'phosphor-react-native/src/icons/EyeSlash';
import { Link } from 'expo-router';
import {
  Platform,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
  type PressableProps
} from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import {
  PostAction,
  PostAuthor,
  PostAuthorName,
  PostAvatar,
  PostHeader,
  PostMeta,
  PostTitle
} from '@/feature/common/components/post';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { timeAgo } from '@/feature/common/helpers/time-ago';
import { useScreenReaderEnabled } from '@/feature/common/helpers/use-screen-reader-enabled';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { communityCatalog } from '@/feature/community/translations/catalog';
import type { CommunityQuestionSummary } from '@/feature/community/types/community';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { useQuestionActions } from './question-actions';
import { QuestionStatus } from './question-status';

type QuestionCardProps = {
  question: CommunityQuestionSummary;
  /** Marks the question as having answers the member has not read. */
  unread?: boolean;
  onPress: (question: CommunityQuestionSummary) => void;
};

export function QuestionCard({ question, unread = false, onPress }: QuestionCardProps) {
  const t = useTranslations(communityCatalog);
  const tc = useTranslations(commonCatalog);
  const actions = useQuestionActions();
  const screenReader = useScreenReaderEnabled();
  if (!actions || !question.slug) {
    return <QuestionCardContent question={question} unread={unread} onPress={() => onPress(question)} />;
  }

  // expo-router's native context menu wrapper hides its trigger from VoiceOver.
  if (Platform.OS !== 'ios' || screenReader) {
    return <QuestionCardWithActions question={question} unread={unread} onPress={onPress} />;
  }

  const voted = actions.isVoted(question);
  const manage = actions.canManage(question);
  const link = actions.linkOf(question);

  return (
    <Link href={{ pathname: '/community/[slug]', params: { slug: question.slug } }} asChild>
      <Link.Trigger>
        <QuestionCardContent question={question} unread={unread} />
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
        <Link.MenuAction
          icon={question.isFollowing ? 'bell.slash' : 'bell'}
          disabled={actions.offline}
          onPress={() => actions.toggleFollow(question)}
        >
          {question.isFollowing ? t('unfollowQuestion') : t('followQuestion')}
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
          icon={question.isHidden ? 'eye' : 'eye.slash'}
          hidden={!actions.canModerate}
          disabled={actions.offline}
          onPress={() => actions.toggleHidden(question)}
        >
          {question.isHidden ? t('showToLearners') : t('hideFromLearners')}
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

/** The card without the native menu: long-press opens the actions sheet, and screen readers get them as actions. */
function QuestionCardWithActions({ question, unread, onPress }: QuestionCardProps & { unread: boolean }) {
  const t = useTranslations(communityCatalog);
  const actions = useQuestionActions();
  if (!actions) return null;

  const manage = actions.canManage(question);
  const handlers: Record<string, () => void> = {
    upvote: () => actions.upvote(question),
    follow: () => actions.toggleFollow(question),
    copyLink: () => actions.copyLink(question),
    edit: () => actions.edit(question),
    visibility: () => actions.toggleHidden(question),
    delete: () => actions.remove(question)
  };
  const accessibilityActions: AccessibilityActionInfo[] = [
    actions.canUpvote(question) ? { name: 'upvote', label: t('upvote') } : null,
    actions.offline
      ? null
      : { name: 'follow', label: question.isFollowing ? t('unfollowQuestion') : t('followQuestion') },
    actions.linkOf(question) ? { name: 'copyLink', label: t('copyLink') } : null,
    manage && !actions.offline ? { name: 'edit', label: t('editQuestion') } : null,
    actions.canModerate && !actions.offline
      ? { name: 'visibility', label: question.isHidden ? t('showToLearners') : t('hideFromLearners') }
      : null,
    manage && !actions.offline ? { name: 'delete', label: t('deleteQuestion') } : null
  ].filter((action) => action !== null);

  return (
    <QuestionCardContent
      question={question}
      unread={unread}
      onPress={() => onPress(question)}
      onLongPress={() => actions.openMenu(question)}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={(event: AccessibilityActionEvent) => handlers[event.nativeEvent.actionName]?.()}
    />
  );
}

type QuestionCardContentProps = Pick<
  PressableProps,
  'onPress' | 'onLongPress' | 'accessibilityActions' | 'onAccessibilityAction'
> & {
  question: CommunityQuestionSummary;
  unread: boolean;
};

function QuestionCardContent({
  question,
  unread,
  onPress,
  onLongPress,
  accessibilityActions,
  onAccessibilityAction
}: QuestionCardContentProps) {
  const t = useTranslations(communityCatalog);
  const { colors, elevation } = useTheme();
  const locale = useLocale();
  const author = question.authorFullname || t('formerMember');
  const answers = Number(question.comments) || 0;
  const votes = question.votes ?? 0;
  const accepted = Boolean(question.acceptedAnswerId);
  const counts = { upvotes: t('upvoteCount', { count: votes }), answers: t('answerCount', { count: answers }) };
  const summary = question.courseTitle
    ? t('questionCardLabel', { title: question.title, author, course: question.courseTitle, ...counts })
    : t('questionCardLabelNoCourse', { title: question.title, author, ...counts });
  const label = [
    question.isHidden ? t('hiddenFromLearners') : null,
    summary,
    accepted ? t('acceptedAnswer') : null,
    unread ? t('newAnswers') : null,
    question.isFollowing ? t('following') : null
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      scaleTo={0.985}
      onPress={(event) => {
        tapHaptic();
        onPress?.(event);
      }}
      onLongPress={onLongPress ?? undefined}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      style={[
        styles.card,
        { backgroundColor: question.isHidden ? colors.muted : colors.surface, borderColor: colors.border },
        !question.isHidden && elevation.raised
      ]}
    >
      {question.isHidden ? (
        <QuestionStatus icon={EyeSlashIcon} tone="warning">
          {t('hiddenFromLearners')}
        </QuestionStatus>
      ) : null}
      <PostHeader>
        <PostAvatar name={author} />
        <PostAuthor>
          <PostAuthorName>{author}</PostAuthorName>
          <PostMeta>
            {[question.courseTitle, timeAgo(question.createdAt, undefined, locale)].filter(Boolean).join(' · ')}
          </PostMeta>
        </PostAuthor>
        {unread ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
      </PostHeader>
      <PostTitle numberOfLines={3}>{question.title}</PostTitle>
      <View style={styles.footer}>
        <PostAction icon={ArrowFatUpIcon}>{votes}</PostAction>
        <PostAction icon={ChatIcon}>{answers}</PostAction>
        {question.isFollowing ? <Icon icon={BellSimpleIcon} size={15} tone="subtle" weight="fill" /> : null}
        <View style={styles.status}>
          <QuestionCardStatus unread={unread} accepted={accepted} answers={answers} />
        </View>
      </View>
    </PressableScale>
  );
}

function QuestionCardStatus({ unread, accepted, answers }: { unread: boolean; accepted: boolean; answers: number }) {
  const t = useTranslations(communityCatalog);

  if (unread) {
    return (
      <Text variant="captionStrong" tone="primary" numberOfLines={1}>
        {t('newAnswers')}
      </Text>
    );
  }

  if (accepted) {
    return (
      <QuestionStatus icon={CheckCircleIcon} tone="success">
        {t('acceptedAnswer')}
      </QuestionStatus>
    );
  }

  if (answers === 0) {
    return (
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {t('noAnswersYet')}
      </Text>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    gap: SPACING.sm,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.xl,
    borderCurve: 'continuous'
  },
  unreadDot: { width: 9, height: 9, borderRadius: RADII.pill },
  footer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  status: { flex: 1, minWidth: 0, alignItems: 'flex-end' }
});
