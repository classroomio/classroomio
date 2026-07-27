<script lang="ts">
  import { onMount } from 'svelte';

  import { profile } from '$lib/utils/store/user';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { newsfeedApi } from '$features/course/api';

  import * as CommentTree from '@cio/ui/custom/comment-tree';
  import { Button } from '@cio/ui/base/button';
  import { Textarea } from '@cio/ui/base/textarea';
  import type { Feed } from '$features/course/utils/types';
  import type { NewsfeedCommentsByFeedId } from '$features/course/api';

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
    onAddComment: (content: string, parentId?: number) => Promise<void> | void;
    onDeleteComment: (commentId: string | number, parentId?: number) => void;
  }

  let { courseId, feed, author, comments, onAddComment, onDeleteComment }: Props = $props();

  let activeReplyTarget = $state<{ id: number; fullname: string } | null>(null);
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
    editingText = currentContent;
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
      const res = newsfeedApi.commentsByFeedId[feed.id];
      if (res?.items?.length) {
        visibleCount = Math.max(visibleCount, res.items.length);
      }
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
    while (comments.hasMore && comments.items.length < target && !comments.isLoading) {
      await newsfeedApi.loadMoreComments(courseId, feed.id, PAGE_SIZE);
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

  const handleReplyClick = (commentId: number, authorName: string) => {
    activeReplyTarget = { id: commentId, fullname: authorName };
  };

  const handleCancelReply = () => {
    activeReplyTarget = null;
  };

  const handleSubmit = async (text: string) => {
    if (isSubmitting) return;
    isSubmitting = true;
    try {
      const parentId = activeReplyTarget?.id;
      await onAddComment(text, parentId);
      if (parentId) {
        expandedRepliesMap[parentId] = true;
      }
      activeReplyTarget = null;
    } finally {
      isSubmitting = false;
    }
  };
</script>

<section class="ui:border-t ui:border-border/60 p-4 pt-3">
  {#if totalCount > shownCount}
    <Button
      variant="ghost"
      size="sm"
      onclick={showMore}
      disabled={isBootstrapping || isLoading}
      class="text-muted-foreground hover:text-foreground ui:transition-colors ui:h-auto ui:p-0 ui:justify-start mb-3 text-sm font-medium"
    >
      {#if isBootstrapping || isLoading}
        Loading...
      {:else}
        View more comments ({totalCount - shownCount})
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
            <div class="flex w-full items-start justify-between">
              <div class="flex w-full flex-col gap-1">
                <CommentTree.Header
                  avatarUrl={commentItem.authorAvatarUrl}
                  fullname={commentItem.authorFullname}
                  dateLabel={calDateDiff(commentItem.createdAt)}
                  canEdit={commentItem.authorProfileId === $profile.id}
                  onEdit={() => handleStartEdit(commentIdNum, commentItem.content)}
                  canDelete={commentItem.authorProfileId === $profile.id || $isOrgAdmin}
                  onDelete={() => onDeleteComment(commentItem.id)}
                />
                <div class="pl-10">
                  {#if editingCommentId === commentIdNum}
                    <div class="mt-1 flex flex-col gap-2">
                      <Textarea bind:value={editingText} rows={2} class="text-sm" />
                      <div class="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="xs" onclick={handleCancelEdit} disabled={isSavingEdit}>
                          Cancel
                        </Button>
                        <Button
                          size="xs"
                          onclick={() => handleSaveEdit(commentIdNum)}
                          disabled={isSavingEdit || !editingText.trim()}
                        >
                          {isSavingEdit ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  {:else}
                    <CommentTree.Content content={commentItem.content} />
                    <CommentTree.Actions
                      onReply={() => handleReplyClick(commentIdNum, commentItem.authorFullname || 'User')}
                    />
                  {/if}
                </div>
              </div>
            </div>

            <!-- Nested Replies Thread -->
            <CommentTree.Replies
              replyCount={commentItem.replyCount || 0}
              isExpanded={Boolean(expandedRepliesMap[commentIdNum])}
              onToggleExpand={() => handleToggleReplies(commentIdNum)}
            >
              {#if repliesState?.items}
                {#each repliesState.items as reply (reply.id)}
                  {@const replyIdNum = Number(reply.id)}
                  <CommentTree.Item>
                    <div class="flex w-full flex-col gap-1">
                      <CommentTree.Header
                        avatarUrl={reply.authorAvatarUrl}
                        fullname={reply.authorFullname}
                        dateLabel={calDateDiff(reply.createdAt)}
                        avatarSize="ui:size-7"
                        canEdit={reply.authorProfileId === $profile.id}
                        onEdit={() => handleStartEdit(replyIdNum, reply.content)}
                        canDelete={reply.authorProfileId === $profile.id || $isOrgAdmin}
                        onDelete={() => onDeleteComment(reply.id, commentIdNum)}
                      />
                      <div class="pl-9">
                        {#if editingCommentId === replyIdNum}
                          <div class="mt-1 flex flex-col gap-2">
                            <Textarea bind:value={editingText} rows={2} class="text-sm" />
                            <div class="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="xs" onclick={handleCancelEdit} disabled={isSavingEdit}>
                                Cancel
                              </Button>
                              <Button
                                size="xs"
                                onclick={() => handleSaveEdit(replyIdNum, commentIdNum)}
                                disabled={isSavingEdit || !editingText.trim()}
                              >
                                {isSavingEdit ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        {:else}
                          <CommentTree.Content content={reply.content} />
                          <CommentTree.Actions
                            onReply={() => handleReplyClick(commentIdNum, reply.authorFullname || 'User')}
                          />
                        {/if}
                      </div>
                    </div>
                  </CommentTree.Item>
                {/each}
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
    onCancelReply={handleCancelReply}
    onSubmit={handleSubmit}
    {isSubmitting}
    class="mt-2"
  />
</section>
