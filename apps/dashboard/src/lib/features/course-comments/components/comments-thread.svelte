<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { ReviewAnchorChip, ReviewStatusTag, ReviewThreadCard } from '@cio/ui/custom/review-comments';
  import CheckIcon from '@lucide/svelte/icons/check';
  import { toMentionMarkup } from '@cio/utils/functions/course-comment-mentions';
  import { DeleteModal } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import { locale, t } from '$lib/utils/functions/translations';
  import { courseCommentsApi } from '../api/course-comments.svelte';
  import { commentsPanel } from '../store/comments-panel.svelte';
  import {
    formatCommentDate,
    getAnchorChipKind,
    getAnchorChipLabel,
    getAnchorStateLabel,
    getPersonBadge,
    getPersonName,
    getThreadPath,
    toCommentSegments
  } from '../utils/anchor-utils';
  import { goToThread } from '../utils/navigation';
  import type { CourseComment, CourseCommentThread } from '../utils/types';
  import CommentsComposer from './comments-composer.svelte';

  interface Props {
    courseId: string;
    thread: CourseCommentThread;
  }

  let { courseId, thread }: Props = $props();

  let editingCommentId = $state<string | null>(null);
  let pendingDelete = $state<CourseComment | null>(null);
  let isDeleteOpen = $state(false);
  let isDeleting = $state(false);

  const isActive = $derived(commentsPanel.activeThreadId === thread.id);
  const visibleComments = $derived(isActive ? thread.comments : thread.comments.slice(0, 1));
  const hiddenReplies = $derived(thread.comments.length - visibleComments.length);
  const anchorStateLabel = $derived(getAnchorStateLabel(thread));
  const firstAuthor = $derived(thread.comments[0] ? getPersonName(thread.comments[0].author) : '');
  const resolvedLabel = $derived.by(() => {
    if (thread.status !== 'resolved' || !thread.resolvedBy) return null;

    return $t('course_comments.thread.resolved_by', {
      name: getPersonName(thread.resolvedBy),
      time: thread.resolvedAt ? formatCommentDate(thread.resolvedAt, $locale) : ''
    });
  });

  function commentDateLabel(comment: CourseComment): string {
    const date = formatCommentDate(comment.createdAt, $locale);

    return comment.editedAt ? `${date} · ${$t('course_comments.thread.edited')}` : date;
  }

  function editMarkup(comment: CourseComment): string {
    const names = new Map(comment.mentions.map((mention) => [mention.profileId, mention.fullname]));

    return toMentionMarkup(comment.body, comment.mentions, (profileId) => names.get(profileId) ?? null);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${getThreadPath(courseId, thread)}`);
      snackbar.success('course_comments.snackbar.link_copied');
    } catch {
      snackbar.error('course_comments.snackbar.link_copy_failed');
    }
  }

  async function saveEdit(comment: CourseComment, markup: string) {
    const saved = await courseCommentsApi.edit(thread.id, comment.id, markup);
    if (saved) editingCommentId = null;

    return saved;
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    isDeleting = true;
    await courseCommentsApi.remove(thread.id, pendingDelete.id);
    isDeleting = false;
    isDeleteOpen = false;
    pendingDelete = null;
  }

  function askToDelete(comment: CourseComment) {
    pendingDelete = comment;
    isDeleteOpen = true;
  }

  function toggleStatus() {
    if (thread.status === 'open') {
      void courseCommentsApi.resolve(thread.id);
      return;
    }

    void courseCommentsApi.reopen(thread.id);
  }
</script>

<ReviewThreadCard.Root
  active={isActive}
  unread={thread.unreadCount > 0}
  resolved={thread.status === 'resolved'}
  hovered={commentsPanel.hoverThreadId === thread.id}
  label={$t('course_comments.thread.label', { name: firstAuthor, anchor: getAnchorChipLabel(thread) })}
  testId="course-comments-thread"
  onSelect={() => void goToThread(courseId, thread)}
  onHoverChange={(hovered) => (commentsPanel.hoverThreadId = hovered ? thread.id : null)}
>
  <ReviewThreadCard.Header copyLinkLabel={$t('course_comments.thread.copy_link')} onCopyLink={copyLink}>
    <ReviewAnchorChip kind={getAnchorChipKind(thread)} label={getAnchorChipLabel(thread)} />
    {#if thread.anchorType === 'point' && thread.anchor.x !== null}
      <ReviewStatusTag variant="pinned" label={$t('course_comments.thread.pinned')} />
    {/if}
    {#if anchorStateLabel}
      <ReviewStatusTag variant="removed" label={anchorStateLabel} />
    {/if}
    {#if thread.status === 'resolved'}
      <ReviewStatusTag variant="resolved" label={$t('course_comments.thread.resolved')} />
    {/if}
    {#if thread.unreadCount > 0}
      <ReviewStatusTag variant="new" label={$t('course_comments.thread.new_count', { count: thread.unreadCount })} />
    {/if}
  </ReviewThreadCard.Header>

  {#if thread.anchorType === 'text' && thread.anchor.quote}
    <ReviewThreadCard.Quote text={thread.anchor.quote} removed={thread.anchorState === 'text_removed'} />
  {/if}

  {#each visibleComments as comment (comment.id)}
    <ReviewThreadCard.Comment
      author={{ fullname: getPersonName(comment.author), avatarUrl: comment.author.avatarUrl }}
      badge={getPersonBadge(comment.author)}
      dateLabel={commentDateLabel(comment)}
      segments={toCommentSegments(comment)}
      canEdit={isActive && comment.canEdit}
      canDelete={isActive && comment.canDelete}
      onEdit={() => (editingCommentId = comment.id)}
      onDelete={() => askToDelete(comment)}
      editLabel={$t('course_comments.thread.edit')}
      deleteLabel={$t('course_comments.thread.delete')}
    >
      {#snippet editor()}
        {#if editingCommentId === comment.id}
          <CommentsComposer
            initialValue={editMarkup(comment)}
            placeholder={$t('course_comments.composer.edit_placeholder')}
            submitLabel={$t('course_comments.composer.save')}
            autofocus
            onSubmit={(markup) => saveEdit(comment, markup)}
            onCancel={() => (editingCommentId = null)}
          />
        {:else}
          <ReviewThreadCard.Body segments={toCommentSegments(comment)} />
        {/if}
      {/snippet}
    </ReviewThreadCard.Comment>
  {/each}

  {#if hiddenReplies > 0}
    <p class="ui:text-muted-foreground pl-9 text-xs">
      {$t('course_comments.thread.replies', { count: hiddenReplies })}
    </p>
  {/if}

  {#if isActive}
    <div class="mt-2">
      <CommentsComposer
        placeholder={$t('course_comments.composer.reply_placeholder')}
        submitLabel={$t('course_comments.composer.reply')}
        testId="course-comments-reply"
        onSubmit={(markup) => courseCommentsApi.reply(thread.id, markup)}
      />
    </div>
  {/if}

  {#if isActive || thread.status === 'resolved'}
    <ReviewThreadCard.Footer statusLabel={resolvedLabel}>
      <Button size="sm" variant="outline" onclick={toggleStatus}>
        {#if thread.status === 'open'}
          <CheckIcon class="size-3.5" />
          {$t('course_comments.thread.resolve')}
        {:else}
          {$t('course_comments.thread.reopen')}
        {/if}
      </Button>
    </ReviewThreadCard.Footer>
  {/if}
</ReviewThreadCard.Root>

<DeleteModal bind:open={isDeleteOpen} isLoading={isDeleting} onDelete={confirmDelete} />
