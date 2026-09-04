<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';

  import { profile } from '$lib/utils/store/user';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { newsfeedApi } from '$features/course/api';
  import { getReplySnippet, stripLegacyReplyQuote } from '$features/course/utils/newsfeed-comment-utils';

  import * as CommentTree from '@cio/ui/custom/comment-tree';
  import type { CommentTreeNodeData } from '@cio/ui/custom/comment-tree';
  import { Button } from '@cio/ui/base/button';
  import { Textarea } from '@cio/ui/base/textarea';
  import type { Feed } from '$features/course/utils/types';

  interface Props {
    courseId?: string;
    feed: Feed;
    author: {
      id: string;
      profileId: string;
      username: string;
      fullname: string;
      avatarUrl: string;
    };
    onAddComment: (content: string, parentId?: number) => Promise<void> | void;
    onDeleteComment: (commentId: number) => void;
  }

  let { courseId, feed, author, onAddComment, onDeleteComment }: Props = $props();

  const INDENT_CAP = 5;
  const ROOT_PAGE_SIZE = 5;
  const CHILD_PAGE_SIZE = 3;
  const FETCH_DEPTH = 3;

  let activeReplyTarget = $state<{ commentId: number; fullname: string; snippet: string } | null>(null);
  let isSubmitting = $state(false);
  let didBootstrap = $state(false);
  let focusedRootId = $state<number | null>(null);

  let editingCommentId = $state<number | null>(null);
  let editingText = $state('');
  let isSavingEdit = $state(false);

  const collapsedIds = new SvelteSet<number>();

  const thread = $derived(newsfeedApi.threadByFeedId[feed.id]);
  const totalCount = $derived(thread?.totalCommentCount ?? feed.commentCount ?? 0);
  const isLoading = $derived(thread?.isLoading ?? false);

  const labels = $derived({
    collapse: $t('course.navItem.news_feed.comments.collapse_thread'),
    expand: $t('course.navItem.news_feed.comments.expand_thread'),
    continueThread: $t('course.navItem.news_feed.comments.continue_thread'),
    moreReplies: (count: number) => $t('course.navItem.news_feed.comments.more_replies', { count }),
    collapsedSummary: (count: number) => $t('course.navItem.news_feed.comments.collapsed_summary', { count })
  });

  function buildNode(id: number, depth: number): CommentTreeNodeData {
    const state = newsfeedApi.commentStateById[String(id)];
    const childIds = newsfeedApi.childIdsByParent[String(id)] ?? [];

    return {
      id,
      depth,
      children: childIds.map((childId) => buildNode(childId, depth + 1)),
      directReplyCount: state?.directReplyCount ?? 0,
      descendantCount: state?.descendantCount ?? 0,
      isLoading: state?.isLoading ?? false
    };
  }

  const rootNodes = $derived.by(() => {
    if (focusedRootId !== null) return [buildNode(focusedRootId, 0)];

    return (thread?.rootIds ?? []).map((id) => buildNode(id, 0));
  });

  const commentOf = (id: number) => newsfeedApi.commentById[String(id)];

  onMount(async () => {
    if (!courseId || didBootstrap) return;

    if (totalCount > 0 && (thread?.rootIds.length ?? 0) === 0) {
      didBootstrap = true;
      await newsfeedApi.getThread(courseId, feed.id, {
        limit: ROOT_PAGE_SIZE,
        childLimit: CHILD_PAGE_SIZE,
        maxDepth: FETCH_DEPTH
      });
    }
  });

  const handleToggleCollapse = (id: number) => {
    if (collapsedIds.has(id)) collapsedIds.delete(id);
    else collapsedIds.add(id);
  };

  const handleLoadMoreChildren = async (id: number) => {
    if (!courseId) return;

    await newsfeedApi.loadMoreReplies(courseId, feed.id, id, {
      childLimit: CHILD_PAGE_SIZE,
      maxDepth: FETCH_DEPTH
    });
  };

  const handleContinueThread = async (id: number) => {
    if (!courseId) return;

    focusedRootId = id;
    await newsfeedApi.loadMoreReplies(courseId, feed.id, id, {
      childLimit: CHILD_PAGE_SIZE,
      maxDepth: FETCH_DEPTH,
      fromStart: true
    });
  };

  const handleBackToComments = () => {
    focusedRootId = null;
  };

  const handleShowMore = async () => {
    if (!courseId) return;

    await newsfeedApi.loadMoreComments(courseId, feed.id, ROOT_PAGE_SIZE);
  };

  const handleStartEdit = (commentId: number, content: string) => {
    editingCommentId = commentId;
    editingText = stripLegacyReplyQuote(content ?? '');
  };

  const handleCancelEdit = () => {
    editingCommentId = null;
    editingText = '';
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!courseId || isSavingEdit || !editingText.trim()) return;

    isSavingEdit = true;
    try {
      await newsfeedApi.updateComment(courseId, String(commentId), editingText.trim());
      if (newsfeedApi.success) {
        editingCommentId = null;
        editingText = '';
      }
    } finally {
      isSavingEdit = false;
    }
  };

  const handleReplyClick = (commentId: number, fullname: string, content: string) => {
    activeReplyTarget = { commentId, fullname, snippet: getReplySnippet(content ?? '') };
  };

  const handleCancelReply = () => {
    activeReplyTarget = null;
  };

  const handleSubmit = async (text: string) => {
    if (isSubmitting) return;

    isSubmitting = true;
    try {
      const parentId = activeReplyTarget?.commentId;
      await onAddComment(text, parentId);

      if (parentId !== undefined) collapsedIds.delete(parentId);
      activeReplyTarget = null;
    } finally {
      isSubmitting = false;
    }
  };
</script>

<section class="ui:border-border/60 border-t px-3 pb-3">
  {#if focusedRootId !== null}
    <Button
      variant="ghost"
      size="sm"
      onclick={handleBackToComments}
      class="ui:text-muted-foreground ui:hover:text-foreground mb-2 h-auto justify-start p-0 text-sm font-medium transition-colors"
    >
      {$t('course.navItem.news_feed.comments.back_to_comments')}
    </Button>
  {:else if thread?.hasMore}
    <Button
      variant="ghost"
      size="sm"
      onclick={handleShowMore}
      disabled={isLoading}
      loading={isLoading}
      class="ui:text-muted-foreground ui:hover:text-foreground ui:transition-colors ui:h-auto ui:p-0 ui:justify-start mb-2 text-sm font-medium"
    >
      {$t('course.navItem.news_feed.comments.view_more', {
        count: Math.max((thread?.totalRootCount ?? 0) - (thread?.rootIds.length ?? 0), 0)
      })}
    </Button>
  {/if}

  <CommentTree.Root class="max-h-[400px] overflow-y-auto py-1">
    {#each rootNodes as node (node.id)}
      <CommentTree.Node
        {node}
        indentCap={INDENT_CAP}
        {labels}
        isCollapsed={(id) => collapsedIds.has(id)}
        onToggleCollapse={handleToggleCollapse}
        onLoadMoreChildren={handleLoadMoreChildren}
        onContinueThread={handleContinueThread}
      >
        {#snippet body({ node: current })}
          {@const comment = commentOf(current.id)}
          {#if comment}
            <div id="comment-{comment.id}" class="flex w-full flex-col gap-0.5">
              <CommentTree.Header
                avatarUrl={comment.authorAvatarUrl}
                fullname={comment.authorFullname}
                dateLabel={calDateDiff(comment.createdAt)}
                avatarSize={current.depth === 0 ? 'ui:size-7' : 'ui:size-6'}
                canEdit={comment.authorProfileId === $profile.id}
                onEdit={() => handleStartEdit(current.id, comment.content ?? '')}
                canDelete={comment.authorProfileId === $profile.id || $isOrgAdmin}
                onDelete={() => onDeleteComment(current.id)}
                editLabel={$t('course.navItem.news_feed.card.edit')}
                deleteLabel={$t('course.navItem.news_feed.comments.delete')}
              />

              <div class="pl-8">
                {#if editingCommentId === current.id}
                  <div class="mt-1 flex flex-col gap-2">
                    <Textarea bind:value={editingText} rows={2} class="text-sm" />
                    <div class="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="xs" onclick={handleCancelEdit} disabled={isSavingEdit}>
                        {$t('course.navItem.news_feed.heading_button.cancel')}
                      </Button>
                      <Button
                        size="xs"
                        onclick={() => handleSaveEdit(current.id)}
                        disabled={isSavingEdit || !editingText.trim()}
                        loading={isSavingEdit}
                      >
                        {$t('course.navItem.news_feed.comments.save')}
                      </Button>
                    </div>
                  </div>
                {:else}
                  {#if comment.replyToAuthorFullname && comment.replyToCommentId !== comment.parentId}
                    <CommentTree.ReplyingTo
                      label={$t('course.navItem.news_feed.comments.replying_to', {
                        name: comment.replyToAuthorFullname
                      })}
                      class="mb-0.5"
                    />
                  {/if}
                  <CommentTree.Content content={comment.content} />
                  <CommentTree.Actions
                    replyLabel={$t('course.navItem.news_feed.comments.reply')}
                    onReply={() =>
                      handleReplyClick(
                        current.id,
                        comment.authorFullname || $t('course.navItem.news_feed.user'),
                        comment.content ?? ''
                      )}
                  />
                {/if}
              </div>
            </div>
          {/if}
        {/snippet}
      </CommentTree.Node>
    {/each}
  </CommentTree.Root>

  <CommentTree.Input
    authorAvatarUrl={author.avatarUrl}
    placeholder={$t('course.navItem.news_feed.comments.placeholder')}
    replyingToUser={activeReplyTarget?.fullname || null}
    replyingToSnippet={activeReplyTarget?.snippet || null}
    onCancelReply={handleCancelReply}
    cancelLabel={$t('course.navItem.news_feed.comments.cancel_reply')}
    onSubmit={handleSubmit}
    {isSubmitting}
    class="mt-1.5"
  />
</section>
