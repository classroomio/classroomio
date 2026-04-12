<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProgramNewsfeedItem } from '$features/program/utils/types';
  import { programNewsfeedApi, type ProgramNewsfeedCommentsByFeedId } from '$features/program/api';
  import {
    getNewsfeedReactionCounts,
    getSelectedNewsfeedReactionType,
    NewsfeedReactions
  } from '@cio/ui/custom/newsfeed-reactions';
  import DeleteConfirmation from './delete-confirmation.svelte';
  import Header from './header.svelte';
  import Comments from './comments.svelte';

  interface Props {
    feed: ProgramNewsfeedItem;
    comments?: ProgramNewsfeedCommentsByFeedId;
    programId?: string;
    editFeed: ProgramNewsfeedItem | null;
    author: {
      id: string;
      username: string;
      fullname: string;
      avatarUrl: string;
    };
    reactionAuthorId: string;
    canComment?: boolean;
    canManageFeed?: boolean;
    edit?: boolean;
    deleteFeed?: (feedId: string) => void;
    deleteComment?: (feedId: string, commentId: string) => void;
    addNewComment?: (content: string, feedId: string) => Promise<void> | void;
    addNewReaction?: (reactionType: string, feedId: string, authorId: string) => Promise<void> | void;
    onPin?: (feedId: ProgramNewsfeedItem['id'], isPinned: ProgramNewsfeedItem['isPinned']) => void;
    isActive?: boolean;
    isReacting?: boolean;
  }

  let {
    feed,
    comments,
    programId,
    editFeed = $bindable(),
    author,
    reactionAuthorId,
    canComment = true,
    canManageFeed = false,
    edit = $bindable(false),
    deleteFeed = (_feedId: string) => {},
    deleteComment = (_feedId: string, _commentId: string) => {},
    addNewComment = (_content: string, _feedId: string) => {},
    addNewReaction = (_reactionType: string, _feedId: string, _authorId: string) => {},
    onPin = (_feedId: string, _isPinned: boolean | null) => {},
    isActive = false,
    isReacting = false
  }: Props = $props();

  let isDeleteFeedModal = $state(false);

  const reactionCounts = $derived(getNewsfeedReactionCounts(feed.reaction));
  const selectedReactionType = $derived(getSelectedNewsfeedReactionType(feed.reaction, reactionAuthorId));

  const openEditFeed = () => {
    programNewsfeedApi.openNewFeedModal();
    edit = true;
    editFeed = feed;
  };

  const handleReact = (reactionType: string) => addNewReaction(reactionType, feed.id, reactionAuthorId);

  onMount(() => {
    if (!isActive) {
      return;
    }

    const element = document.getElementById(feed.id);
    element?.scrollIntoView({
      block: 'start',
      behavior: 'smooth',
      inline: 'nearest'
    });
  });
</script>

<div
  id={feed.id}
  class="mb-7 flex w-full max-w-3xl flex-col justify-between gap-2 rounded-md {isActive
    ? 'border-primary-700 border-2'
    : 'border border-gray-200'}"
>
  <Header
    {feed}
    {canManageFeed}
    {onPin}
    onEdit={openEditFeed}
    onRequestDelete={() => {
      isDeleteFeedModal = true;
    }}
  />

  <div class="px-3 pt-1 pb-2">
    <NewsfeedReactions
      {reactionCounts}
      {selectedReactionType}
      disabled={isReacting || !reactionAuthorId}
      onReactionToggle={handleReact}
    />
  </div>

  <Comments
    {programId}
    {feed}
    {author}
    {comments}
    {canComment}
    onAddComment={async (content) => {
      await addNewComment(content, feed.id);
    }}
    onDeleteComment={(commentId) => {
      deleteComment(feed.id, String(commentId));
    }}
  />

  <DeleteConfirmation
    bind:openDeleteModal={isDeleteFeedModal}
    deleteFeed={() => {
      deleteFeed(feed.id);
    }}
  />
</div>
