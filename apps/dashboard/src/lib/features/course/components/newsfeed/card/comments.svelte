<script lang="ts">
  import { onMount } from 'svelte';

  import { profile } from '$lib/utils/store/user';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { newsfeedApi } from '$features/course/api';
  import { getReplySnippet, stripLegacyReplyQuote } from '$features/course/utils/newsfeed-comment-utils';

  import * as CommentTree from '@cio/ui/custom/comment-tree';
  import { Button } from '@cio/ui/base/button';
  import { Textarea } from '@cio/ui/base/textarea';
  import type { Feed } from '$features/course/utils/types';
  import type { NewsfeedCommentsByFeedId } from '$features/course/api';
  import { reportDialog } from '$features/report';

  interface Props {
    courseId?: string;
    feed: Feed;
    author: {
      id: string;
      username: string;
      fullname: string;
      avatarUrl: string;
    };
    comments?: NewsfeedCommentsByFeedId;
    onAddComment: (
      content: string,
      parentId?: number,
      replyTo?: { commentId: number; authorFullname: string }
    ) => Promise<void> | void;
    onDeleteComment: (commentId: string | number, parentId?: number) => void;
  }

  let { courseId, feed, author, comments, onAddComment, onDeleteComment }: Props = $props();

  let activeReplyTarget = $state<{
    id: number;
    commentId: number;
    fullname: string;
    snippet: string;
  } | null>(null);
  let isSubmitting = $state(false);
  let isBootstrapping = $state(false);
  let didBootstrap = $state(false);
  let expandedRepliesMap = $state<Record<number, boolean>>({});

  let editingCommentId = $state<number | null>(null);
  let editingText = $state('');
  let isSavingEdit = $state(false);

  const PAGE_SIZE = 10;
  let visibleCount = $state(2);

  const handleStartEdit = (commentId: number, currentContent: string) => {
    editingCommentId = commentId;
    editingText = stripLegacyReplyQuote(currentContent);
  };

  const handleCancelEdit = () => {
    editingCommentId = null;
    editingText = '';
  };

  const handleSaveEdit = async (commentId: number, parentId?: number) => {
    if (!courseId || isSavingEdit || !editingText.trim()) return;
    isSavingEdit = true;
    try {
      await newsfeedApi.updateComment(courseId, feed.id, String(commentId), editingText.trim(), parentId);
      if (newsfeedApi.success) {
        editingCommentId = null;
        editingText = '';
      }
    } finally {
      isSavingEdit = false;
    }
  };

  const loadedCount = $derived((comments?.items?.length ?? 0) as number);
  const totalCount = $derived(comments?.totalCount ?? feed.commentCount ?? 0);
  const isLoading = $derived((comments?.isLoading ?? false) as boolean);
  const shownCount = $derived(Math.min(visibleCount, Math.max(loadedCount, 0)));

  const bootstrap = async () => {
    if (!courseId || didBootstrap) return;
    didBootstrap = true;
    isBootstrapping = true;
    try {
      await newsfeedApi.getComments(courseId, feed.id, PAGE_SIZE);
    } finally {
      isBootstrapping = false;
    }
  };

  onMount(async () => {
    if (totalCount > 0 && (!comments || comments.items.length === 0)) {
      await bootstrap();
    }
  });

  const ensureLoaded = async (targetVisible: number) => {
    if (!courseId || !comments) return;
    const target = Math.min(targetVisible, comments.totalCount);
    while (true) {
      const current = newsfeedApi.commentsByFeedId[feed.id];
      if (!current || !current.hasMore || current.isLoading || current.items.length >= target) break;
      const prevLength = current.items.length;
      await newsfeedApi.loadMoreComments(courseId, feed.id, PAGE_SIZE);
      const updated = newsfeedApi.commentsByFeedId[feed.id];
      if (!updated || updated.items.length <= prevLength) break;
    }
  };

  const showMore = async () => {
    if (!courseId || !comments) return;
    if (!didBootstrap) await bootstrap();
    const next = visibleCount + PAGE_SIZE;
    visibleCount = next;
    await ensureLoaded(next);
  };

  const handleToggleReplies = async (parentId: number) => {
    const isCurrentlyExpanded = Boolean(expandedRepliesMap[parentId]);
    expandedRepliesMap[parentId] = !isCurrentlyExpanded;

    if (!isCurrentlyExpanded && courseId) {
      await newsfeedApi.getReplies(courseId, feed.id, parentId);
    }
  };

  const handleReplyClick = (topLevelId: number, targetCommentId: number, authorName: string, content: string) => {
    const snippet = getReplySnippet(content);
    activeReplyTarget = {
      id: topLevelId,
      commentId: targetCommentId,
      fullname: authorName,
      snippet
    };
  };

  const handleCancelReply = () => {
    activeReplyTarget = null;
  };

  const handleSubmit = async (text: string) => {
    if (isSubmitting) return;
    isSubmitting = true;
    try {
      const parentId = activeReplyTarget?.id;
      const replyTo = activeReplyTarget
        ? { commentId: activeReplyTarget.commentId, authorFullname: activeReplyTarget.fullname }
        : undefined;

      await onAddComment(text, parentId, replyTo);
      if (parentId) {
        expandedRepliesMap[parentId] = true;
      }
      activeReplyTarget = null;
    } finally {
      isSubmitting = false;
    }
  };
</script>

<section class="ui:border-t ui:border-border/60 px-4 pb-4">
  {#if totalCount > shownCount}
    <Button
      variant="ghost"
      size="sm"
      onclick={showMore}
      disabled={isBootstrapping || isLoading}
      class="text-muted-foreground hover:text-foreground ui:transition-colors ui:h-auto ui:p-0 ui:justify-start mb-3 text-sm font-medium"
    >
      {#if isBootstrapping || isLoading}
        {$t('course.navItem.news_feed.comments.loading')}
      {:else}
        {$t('course.navItem.news_feed.comments.view_more', { count: totalCount - shownCount })}
      {/if}
    </Button>
  {/if}

  <CommentTree.Root class="max-h-[400px] overflow-y-auto py-2">
    {#if comments}
      {#each comments.items.slice(0, shownCount) as commentItem (commentItem.id)}
        {#if commentItem.content}
          {@const commentIdNum = Number(commentItem.id)}
          {@const repliesState = newsfeedApi.repliesByParentId[commentIdNum]}

          <CommentTree.Item>
            <div id="comment-{commentItem.id}" class="flex w-full items-start justify-between">
              <div class="flex w-full flex-col gap-1">
                <CommentTree.Header
                  avatarUrl={commentItem.authorAvatarUrl}
                  fullname={commentItem.authorFullname}
                  dateLabel={calDateDiff(commentItem.createdAt)}
                  canEdit={commentItem.authorProfileId === $profile.id}
                  onEdit={() => handleStartEdit(commentIdNum, commentItem.content)}
                  canDelete={commentItem.authorProfileId === $profile.id || $isOrgAdmin}
                  onDelete={() => onDeleteComment(commentItem.id)}
                  canReport={commentItem.authorProfileId !== $profile.id}
                  onReport={() => reportDialog.start('course_newsfeed_comment', String(commentItem.id))}
                  reportLabel={$t('report.menu')}
                />
                <div class="pl-10">
                  {#if editingCommentId === commentIdNum}
                    <div class="mt-1 flex flex-col gap-2">
                      <Textarea bind:value={editingText} rows={2} class="text-sm" />
                      <div class="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="xs" onclick={handleCancelEdit} disabled={isSavingEdit}>
                          {$t('course.navItem.news_feed.heading_button.cancel')}
                        </Button>
                        <Button
                          size="xs"
                          onclick={() => handleSaveEdit(commentIdNum)}
                          disabled={isSavingEdit || !editingText.trim()}
                          loading={isSavingEdit}
                        >
                          {$t('course.navItem.news_feed.comments.save')}
                        </Button>
                      </div>
                    </div>
                  {:else}
                    <CommentTree.Content content={commentItem.content} />
                    <CommentTree.Actions
                      replyLabel={$t('course.navItem.news_feed.comments.reply')}
                      deleteLabel={$t('course.navItem.news_feed.comments.delete')}
                      onReply={() =>
                        handleReplyClick(
                          commentIdNum,
                          commentIdNum,
                          commentItem.authorFullname || $t('course.navItem.news_feed.user'),
                          commentItem.content || ''
                        )}
                    />
                  {/if}
                </div>
              </div>
            </div>

            <!-- Nested Replies Thread -->
            <CommentTree.Replies
              replyCount={commentItem.replyCount || 0}
              isExpanded={Boolean(expandedRepliesMap[commentIdNum])}
              showLabel={$t('course.navItem.news_feed.comments.view_replies', { count: commentItem.replyCount || 0 })}
              hideLabel={$t('course.navItem.news_feed.comments.hide_replies')}
              onToggleExpand={() => handleToggleReplies(commentIdNum)}
            >
              {#if repliesState?.items}
                {#each repliesState.items as reply (reply.id)}
                  {@const replyIdNum = Number(reply.id)}
                  <CommentTree.Item>
                    <div id="comment-{reply.id}" class="flex w-full flex-col gap-1">
                      <CommentTree.Header
                        avatarUrl={reply.authorAvatarUrl}
                        fullname={reply.authorFullname}
                        dateLabel={calDateDiff(reply.createdAt)}
                        avatarSize="ui:size-7"
                        canEdit={reply.authorProfileId === $profile.id}
                        onEdit={() => handleStartEdit(replyIdNum, reply.content)}
                        canDelete={reply.authorProfileId === $profile.id || $isOrgAdmin}
                        onDelete={() => onDeleteComment(reply.id, commentIdNum)}
                        canReport={reply.authorProfileId !== $profile.id}
                        onReport={() => reportDialog.start('course_newsfeed_comment', String(reply.id))}
                        reportLabel={$t('report.menu')}
                      />
                      <div class="pl-9">
                        {#if editingCommentId === replyIdNum}
                          <div class="mt-1 flex flex-col gap-2">
                            <Textarea bind:value={editingText} rows={2} class="text-sm" />
                            <div class="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="xs" onclick={handleCancelEdit} disabled={isSavingEdit}>
                                {$t('course.navItem.news_feed.heading_button.cancel')}
                              </Button>
                              <Button
                                size="xs"
                                onclick={() => handleSaveEdit(replyIdNum, commentIdNum)}
                                disabled={isSavingEdit || !editingText.trim()}
                              >
                                {isSavingEdit
                                  ? $t('course.navItem.news_feed.comments.saving')
                                  : $t('course.navItem.news_feed.comments.save')}
                              </Button>
                            </div>
                          </div>
                        {:else}
                          {#if reply.replyToAuthorFullname}
                            <CommentTree.ReplyingTo
                              label={$t('course.navItem.news_feed.comments.replying_to', {
                                name: reply.replyToAuthorFullname
                              })}
                              class="mb-0.5"
                            />
                          {/if}
                          <CommentTree.Content content={reply.content} />
                          <CommentTree.Actions
                            replyLabel={$t('course.navItem.news_feed.comments.reply')}
                            deleteLabel={$t('course.navItem.news_feed.comments.delete')}
                            onReply={() =>
                              handleReplyClick(
                                commentIdNum,
                                replyIdNum,
                                reply.authorFullname || $t('course.navItem.news_feed.user'),
                                reply.content || ''
                              )}
                          />
                        {/if}
                      </div>
                    </div>
                  </CommentTree.Item>
                {/each}

                {#if repliesState.hasMore}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => courseId && newsfeedApi.loadMoreReplies(courseId, feed.id, commentIdNum)}
                    disabled={repliesState.isLoading}
                    class="text-muted-foreground hover:text-foreground ui:transition-colors ui:h-auto ui:p-0 ui:pl-9 ui:justify-start mt-1 text-sm font-medium"
                  >
                    {repliesState.isLoading
                      ? $t('course.navItem.news_feed.comments.loading')
                      : $t('course.navItem.news_feed.comments.load_more_replies')}
                  </Button>
                {/if}
              {/if}
            </CommentTree.Replies>
          </CommentTree.Item>
        {/if}
      {/each}
    {/if}
  </CommentTree.Root>

  <!-- Comment Input Box -->
  <CommentTree.Input
    authorAvatarUrl={author.avatarUrl}
    placeholder={$t('course.navItem.news_feed.comments.placeholder')}
    replyingToUser={activeReplyTarget?.fullname || null}
    replyingToSnippet={activeReplyTarget?.snippet || null}
    onCancelReply={handleCancelReply}
    cancelLabel={$t('course.navItem.news_feed.comments.cancel_reply')}
    onSubmit={handleSubmit}
    {isSubmitting}
    class="mt-2"
  />
</section>
