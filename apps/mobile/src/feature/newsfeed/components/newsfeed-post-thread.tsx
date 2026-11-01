import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/feature/auth/components/auth-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import { Button, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import type { SheetRef } from '@/feature/common/components/bottom-sheet';
import {
  Composer,
  ComposerInput,
  ComposerNotice,
  ComposerReplyTarget,
  ComposerRow,
  ComposerScrollView,
  ComposerSend,
  type ComposerHandle
} from '@/feature/common/components/composer';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { OptionSheet, OptionSheetCancel, OptionSheetItem } from '@/feature/common/components/option-sheet';
import { FlashHighlight } from '@/feature/common/components/flash-highlight';
import { Skeleton } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { successHaptic } from '@/feature/common/helpers/haptics';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useRevealNewItem } from '@/feature/common/helpers/use-reveal-new-item';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { useNewsfeedPostQuery } from '@/feature/newsfeed/api/newsfeed-posts';
import { useToggleReactionMutation } from '@/feature/newsfeed/api/newsfeed-reaction';
import {
  useCommentThreadQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useLoadMoreCommentsMutation,
  useUpdateCommentMutation
} from '@/feature/newsfeed/api/newsfeed-thread';
import { useNewsfeedViewerQuery } from '@/feature/newsfeed/api/newsfeed-viewer';
import { EMPTY_THREAD, flattenThread, stripLegacyReplyQuote } from '@/feature/newsfeed/helpers/comment-thread';
import { viewerReactionOf } from '@/feature/newsfeed/helpers/reactions';
import { newsfeedCatalog } from '@/feature/newsfeed/translations/catalog';
import type {
  NewsfeedComment,
  NewsfeedPost as NewsfeedPostData,
  ReactionType,
  ThreadRow
} from '@/feature/newsfeed/types/newsfeed';

import {
  Comment,
  CommentAction,
  CommentActions,
  CommentBody,
  CommentCollapseToggle,
  CommentHeader,
  CommentMenuButton,
  MoreRepliesRow
} from './comment';
import { NewsfeedPost } from './newsfeed-post';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';

type ComposerMode =
  | { kind: 'new' }
  | { kind: 'reply'; comment: NewsfeedComment }
  | { kind: 'edit'; comment: NewsfeedComment };

const isCommentRow = (row: ThreadRow, id: string) => row.type === 'comment' && String(row.comment.id) === id;

export function NewsfeedPostThread({ courseId, postId }: { courseId: string; postId: string }) {
  const { colors } = useTheme();
  const t = useTranslations(newsfeedCatalog);
  const tc = useTranslations(commonCatalog);
  const { userId } = useAuth();
  const offline = useIsOffline();
  const post = useNewsfeedPostQuery(courseId, postId);
  const viewer = useNewsfeedViewerQuery(courseId);
  const thread = useCommentThreadQuery(courseId, postId);
  const toggleReaction = useToggleReactionMutation(courseId);
  const loadMore = useLoadMoreCommentsMutation(courseId, postId);
  const createComment = useCreateCommentMutation(courseId, postId);
  const updateComment = useUpdateCommentMutation(courseId, postId);
  const deleteComment = useDeleteCommentMutation(courseId, postId);
  const composer = useRef<ComposerHandle>(null);
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<ComposerMode>({ kind: 'new' });
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(new Set());
  const [menu, setMenu] = useState<NewsfeedComment | null>(null);
  const menuSheet = useRef<SheetRef>(null);
  const [confirming, setConfirming] = useState<NewsfeedComment | null>(null);

  const threadData = thread.data ?? EMPTY_THREAD;
  const rows = flattenThread(threadData, collapsed);
  const listRef = useRef<FlashListRef<ThreadRow>>(null);
  const newComment = useRevealNewItem({ listRef, data: rows, matches: isCommentRow });
  const canModerate = viewer.data?.canModerate ?? false;
  const isAuthor = (comment: NewsfeedComment) => Boolean(userId && comment.authorProfileId === userId);
  const loadingParentId =
    loadMore.isPending && loadMore.variables?.kind === 'replies' ? loadMore.variables.parentId : null;
  const loadingRoots = loadMore.isPending && loadMore.variables?.kind === 'roots';

  const loadFailed = (error: unknown) =>
    showToast({ title: t('commentsLoadFailed'), description: errorMessage(error), tone: 'danger' });

  const react = (target: NewsfeedPostData, type: ReactionType) =>
    toggleReaction.mutate(
      { postId: target.id, type, previous: target.reaction },
      {
        onError: (error) => showToast({ title: t('reactionFailed'), description: errorMessage(error), tone: 'danger' })
      }
    );

  const startReply = (comment: NewsfeedComment) => {
    setMode({ kind: 'reply', comment });
    composer.current?.focus();
  };

  const openMenu = (comment: NewsfeedComment) => {
    setMenu(comment);
    menuSheet.current?.present();
  };

  const startEdit = (comment: NewsfeedComment) => {
    setMode({ kind: 'edit', comment });
    setDraft(stripLegacyReplyQuote(comment.content));
    composer.current?.focus();
  };

  const resetComposer = () => {
    setMode({ kind: 'new' });
    setDraft('');
  };

  const toggleCollapsed = (id: number) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });

  const submit = () => {
    const content = draft.trim();
    if (!content) return;

    if (mode.kind === 'edit') {
      updateComment.mutate(
        { commentId: mode.comment.id, content },
        {
          onSuccess: () => {
            successHaptic();
            resetComposer();
            composer.current?.blur();
          },
          onError: (error) =>
            showToast({ title: t('changesNotSaved'), description: errorMessage(error), tone: 'danger' })
        }
      );
      return;
    }

    const parent = mode.kind === 'reply' ? mode.comment : null;
    createComment.mutate(
      { content, parent },
      {
        onSuccess: (created) => {
          successHaptic();
          if (parent) setCollapsed((current) => new Set([...current].filter((id) => id !== parent.id)));
          resetComposer();
          composer.current?.blur();
          newComment.reveal(created.id);
        },
        onError: (error) => showToast({ title: t('commentFailed'), description: errorMessage(error), tone: 'danger' })
      }
    );
  };

  const confirmDelete = () => {
    if (!confirming) return;

    const target = confirming;
    deleteComment.mutate(target, {
      onSuccess: () => {
        setConfirming(null);
        if (mode.kind !== 'new' && mode.comment.id === target.id) resetComposer();
        showToast({ title: t('commentDeleted'), tone: 'success' });
      },
      onError: (error) =>
        showToast({ title: t('commentDeleteFailed'), description: errorMessage(error), tone: 'danger' })
    });
  };

  const renderRow = ({ item }: { item: ThreadRow }) => {
    if (item.type === 'more-replies') {
      return (
        <MoreRepliesRow
          depth={item.depth}
          remaining={item.remaining}
          loading={loadingParentId === item.parentId}
          disabled={offline}
          onPress={() => loadMore.mutate({ kind: 'replies', parentId: item.parentId }, { onError: loadFailed })}
        />
      );
    }

    const comment = item.comment;
    const canDelete = isAuthor(comment) || canModerate;

    return (
      <FlashHighlight active={newComment.highlightedId === String(comment.id)}>
        <Comment comment={comment} depth={item.depth}>
          <CommentHeader>{canDelete ? <CommentMenuButton onPress={() => openMenu(comment)} /> : null}</CommentHeader>
          <CommentBody />
          <CommentActions>
            <CommentAction disabled={offline} onPress={() => startReply(comment)}>
              {t('reply')}
            </CommentAction>
            <CommentCollapseToggle collapsed={collapsed.has(comment.id)} onToggle={() => toggleCollapsed(comment.id)} />
          </CommentActions>
        </Comment>
      </FlashHighlight>
    );
  };

  const postData = post.data;
  const header = postData ? (
    <View style={styles.header}>
      <NewsfeedPost
        post={postData}
        variant="plain"
        viewerReaction={viewerReactionOf(postData.reaction, viewer.data?.groupMemberId)}
        reactionsDisabled={offline}
        onToggleReaction={react}
      />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Text variant="subheading" accessibilityRole="header">
        {threadData.totalCommentCount === 0
          ? t('noCommentsYet')
          : t('commentCount', { count: threadData.totalCommentCount })}
      </Text>
      {thread.isPending && !thread.data ? (
        <View style={styles.skeleton}>
          <Skeleton height={64} radius={RADII.md} />
          <Skeleton height={64} radius={RADII.md} />
        </View>
      ) : null}
      {thread.isError && !thread.data ? (
        <Text variant="caption" tone="danger">
          {errorMessage(thread.error)}
        </Text>
      ) : null}
    </View>
  ) : null;

  const sending = createComment.isPending || updateComment.isPending;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: t('screenTitlePost') }} />

      {!postData && post.isPending ? (
        <View style={styles.loading}>
          <Skeleton height={36} width="50%" />
          <Skeleton height={120} radius={RADII.lg} />
        </View>
      ) : null}

      {!postData && post.isError ? (
        <Empty>
          <EmptyMedia icon={WarningCircleIcon} />
          <EmptyTitle>{t('postLoadFailed')}</EmptyTitle>
          <EmptyDescription>{errorMessage(post.error)}</EmptyDescription>
          <Button variant="outline" onPress={() => router.back()}>
            <ButtonText>{t('backToNewsfeed')}</ButtonText>
          </Button>
        </Empty>
      ) : null}

      {postData ? (
        <FlashList
          ref={listRef}
          data={rows}
          keyExtractor={(row) => row.key}
          getItemType={(row) => row.type}
          renderItem={renderRow}
          ListHeaderComponent={header}
          ListFooterComponent={
            threadData.hasMoreRoots ? (
              <View style={styles.footer}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offline || loadingRoots}
                  onPress={() => loadMore.mutate({ kind: 'roots' }, { onError: loadFailed })}
                >
                  {loadingRoots ? <ButtonSpinner /> : <ButtonText>{t('showOlderComments')}</ButtonText>}
                </Button>
              </View>
            ) : null
          }
          renderScrollComponent={ComposerScrollView}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          refreshControl={<PullRefreshControl onRefresh={() => Promise.all([post.refetch(), thread.refetch()])} />}
          contentContainerStyle={styles.content}
        />
      ) : null}

      {postData ? (
        <Composer
          ref={composer}
          value={draft}
          onChangeText={setDraft}
          onSubmit={submit}
          submitting={sending}
          disabled={offline}
        >
          {offline ? (
            <ComposerNotice title={t('commentOfflineTitle')} description={t('commentOfflineDescription')} />
          ) : (
            <>
              {mode.kind === 'reply' ? (
                <ComposerReplyTarget
                  name={mode.comment.authorFullname || t('replyTargetFallback')}
                  onCancel={() => setMode({ kind: 'new' })}
                />
              ) : null}
              {mode.kind === 'edit' ? (
                <View style={styles.editing}>
                  <Text variant="caption" tone="muted" style={styles.editingLabel}>
                    {t('editingComment')}
                  </Text>
                  <CommentAction onPress={resetComposer}>{tc('cancel')}</CommentAction>
                </View>
              ) : null}
              <ComposerRow>
                <ComposerInput
                  placeholder={mode.kind === 'reply' ? t('writeReply') : t('writeComment')}
                  accessibilityLabel={mode.kind === 'edit' ? t('editCommentInputLabel') : t('commentInputLabel')}
                />
                <ComposerSend accessibilityLabel={mode.kind === 'edit' ? t('saveComment') : t('postComment')} />
              </ComposerRow>
            </>
          )}
        </Composer>
      ) : null}

      <OptionSheet ref={menuSheet} onDismiss={() => setMenu(null)}>
        {menu && isAuthor(menu) ? (
          <OptionSheetItem icon={PencilSimpleIcon} disabled={offline} onSelect={() => startEdit(menu)}>
            {t('editComment')}
          </OptionSheetItem>
        ) : null}
        {menu ? (
          <OptionSheetItem icon={TrashIcon} destructive disabled={offline} onSelect={() => setConfirming(menu)}>
            {t('deleteComment')}
          </OptionSheetItem>
        ) : null}
        <OptionSheetCancel />
      </OptionSheet>

      <AlertDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        busy={deleteComment.isPending}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{t('deleteCommentTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirming && confirming.descendantCount > 0
              ? t('deleteCommentWithReplies', { count: confirming.descendantCount })
              : t('deleteCommentDescription')}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction variant="destructive" loading={deleteComment.isPending} onPress={confirmDelete}>
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { gap: SPACING.sm, padding: GUTTER },
  header: { gap: SPACING.md, paddingBottom: SPACING.xs },
  divider: { height: StyleSheet.hairlineWidth * 2 },
  skeleton: { gap: SPACING.sm },
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  footer: { paddingTop: SPACING.md, alignItems: 'flex-start' },
  editing: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.xxs },
  editingLabel: { flex: 1 }
});
