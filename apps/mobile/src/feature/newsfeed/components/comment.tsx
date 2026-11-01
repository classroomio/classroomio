import { ChevronDown, ChevronRight, CornerDownRight, Ellipsis } from 'lucide-react-native';
import { createContext, use, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/feature/common/components/avatar';
import { HtmlContent } from '@/feature/common/components/html-content';
import { Icon } from '@/feature/common/components/icon';
import { Spinner } from '@/feature/common/components/spinner';
import { Text } from '@/feature/common/components/text';
import { HIT_SLOP, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { timeAgo } from '@/feature/common/helpers/time-ago';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { INDENT_CAP } from '@/feature/newsfeed/constants/thread';
import { stripLegacyReplyQuote } from '@/feature/newsfeed/helpers/comment-thread';
import { newsfeedCatalog } from '@/feature/newsfeed/translations/catalog';
import type { NewsfeedComment } from '@/feature/newsfeed/types/newsfeed';

const INDENT = 18;

function ThreadIndent({ depth, children }: { depth: number; children: ReactNode }) {
  const { colors } = useTheme();
  const levels = Math.min(depth, INDENT_CAP);

  return (
    <View style={styles.indentRow}>
      {Array.from({ length: levels }, (_, index) => (
        <View key={index} style={styles.indentLevel}>
          <View style={[styles.threadLine, { backgroundColor: colors.border }]} />
        </View>
      ))}
      <View style={styles.indentBody}>{children}</View>
    </View>
  );
}

const CommentContext = createContext<NewsfeedComment | null>(null);

function useComment() {
  const comment = use(CommentContext);
  if (!comment) throw new Error('Comment parts must be used inside Comment');

  return comment;
}

export function Comment({
  comment,
  depth,
  children
}: {
  comment: NewsfeedComment;
  depth: number;
  children: ReactNode;
}) {
  return (
    <CommentContext value={comment}>
      <ThreadIndent depth={depth}>
        <View style={styles.comment}>{children}</View>
      </ThreadIndent>
    </CommentContext>
  );
}

export function CommentHeader({ children }: { children?: ReactNode }) {
  const comment = useComment();
  const t = useTranslations(newsfeedCatalog);
  const locale = useLocale();
  const author = comment.authorFullname || t('formerMember');

  return (
    <View style={styles.header}>
      <Avatar name={author} uri={comment.authorAvatarUrl} size={26} />
      <Text variant="captionStrong" numberOfLines={1} style={styles.author}>
        {author}
      </Text>
      <Text variant="caption" tone="muted">
        {timeAgo(comment.createdAt, undefined, locale)}
      </Text>
      <View style={styles.headerEnd}>{children}</View>
    </View>
  );
}

export function CommentBody() {
  const comment = useComment();
  const t = useTranslations(newsfeedCatalog);
  const showReplyTarget = comment.replyToAuthorFullname && comment.replyToCommentId !== comment.parentId;

  return (
    <View style={styles.body}>
      {showReplyTarget ? (
        <Text variant="caption" tone="muted">
          {t('replyingTo', { name: comment.replyToAuthorFullname ?? '' })}
        </Text>
      ) : null}
      <HtmlContent html={stripLegacyReplyQuote(comment.content)} size="compact" preserveLineBreaks />
    </View>
  );
}

export function CommentActions({ children }: { children: ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

export function CommentAction({
  onPress,
  disabled = false,
  children
}: {
  onPress: () => void;
  disabled?: boolean;
  children: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={HIT_SLOP}
      onPress={() => {
        tapHaptic();
        onPress();
      }}
      style={disabled && styles.disabled}
    >
      <Text variant="captionStrong" tone="muted">
        {children}
      </Text>
    </Pressable>
  );
}

export function CommentCollapseToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const comment = useComment();
  const t = useTranslations(newsfeedCatalog);
  if (comment.directReplyCount === 0) return null;

  const count = comment.descendantCount;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(collapsed ? 'showReplies' : 'hideRepliesLabel', { count })}
      hitSlop={HIT_SLOP}
      onPress={onToggle}
      style={styles.toggle}
    >
      <Icon icon={collapsed ? ChevronRight : ChevronDown} size={14} tone="muted" />
      <Text variant="captionStrong" tone="muted">
        {collapsed ? t('showReplies', { count }) : t('hideReplies')}
      </Text>
    </Pressable>
  );
}

export function CommentMenuButton({ onPress }: { onPress: () => void }) {
  const t = useTranslations(newsfeedCatalog);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('commentActions')} hitSlop={HIT_SLOP} onPress={onPress}>
      <Icon icon={Ellipsis} size={17} tone="muted" />
    </Pressable>
  );
}

type MoreRepliesRowProps = {
  depth: number;
  remaining: number;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
};

export function MoreRepliesRow({ depth, remaining, loading, disabled, onPress }: MoreRepliesRowProps) {
  const t = useTranslations(newsfeedCatalog);
  const label = t('showMoreReplies', { count: remaining });

  return (
    <ThreadIndent depth={depth}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={loading || disabled}
        hitSlop={HIT_SLOP}
        onPress={onPress}
        style={[styles.more, disabled && styles.disabled]}
      >
        {loading ? <Spinner /> : <Icon icon={CornerDownRight} size={15} tone="primary" />}
        <Text variant="captionStrong" tone="primary">
          {label}
        </Text>
      </Pressable>
    </ThreadIndent>
  );
}

const styles = StyleSheet.create({
  indentRow: { flexDirection: 'row' },
  indentLevel: { width: INDENT, alignItems: 'center' },
  threadLine: { width: StyleSheet.hairlineWidth * 2, flex: 1 },
  indentBody: { flex: 1, minWidth: 0 },
  comment: { gap: SPACING.xxs + 2, paddingVertical: SPACING.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  author: { flexShrink: 1 },
  headerEnd: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  body: { paddingLeft: 26 + SPACING.xs, gap: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingLeft: 26 + SPACING.xs, minHeight: 24 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  more: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minHeight: 40 },
  disabled: { opacity: 0.45 }
});
