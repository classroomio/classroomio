<script lang="ts">
  import { onMount, tick } from 'svelte';

  import type { Feed } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { newsfeedApi } from '$features/course/api';
  import { getNewsfeedReactionCounts, getSelectedNewsfeedReactionType } from '@cio/ui/custom/newsfeed-reactions';

  import PinIcon from '@lucide/svelte/icons/pin';

  import DeleteConfirmation from './delete-confirmation.svelte';
  import type { NewsfeedCommentsByFeedId } from '$features/course/api';
  import Header from './header.svelte';
  import { NewsfeedReactions } from '@cio/ui/custom/newsfeed-reactions';
  import Comments from './comments.svelte';

  interface Props {
    feed: Feed;
    comments?: NewsfeedCommentsByFeedId;
    courseId?: string;
    editFeed: Feed | null;
    author: {
      id: string;
      username: string;
      fullname: string;
      avatarUrl: string;
    };
    edit?: boolean;
    deleteFeed?: any;
    deleteComment?: any;
    addNewComment?: any;
    addNewReaction?: any;
    onPin?: any;
    isActive?: boolean;
    isReacting?: boolean;
  }

  let {
    feed,
    comments,
    courseId,
    editFeed = $bindable(),
    author,
    edit = $bindable(false),
    deleteFeed = (_arg: string) => {},
    deleteComment = (_arg1: string, _arg2: string) => {},
    addNewComment = (_arg1: string, _arg2: string) => {},
    addNewReaction = (_arg1: string, _arg2: string, _arg3: string) => {},
    onPin = (_feedId: Feed['id'], _isPinned: Feed['isPinned']) => {},
    isActive = false,
    isReacting = false
  }: Props = $props();

  let isDeleteFeedModal = $state(false);

  const openEditFeed = async () => {
    editFeed = feed;
    edit = true;
    await tick();
    newsfeedApi.openNewFeedModal();
  };

  const handleReact = (reactionType: string) => addNewReaction(reactionType, feed.id, author.id);

  const handleDeleteFeed = () => {
    deleteFeed(feed.id);
  };

  const reactionCounts = $derived(getNewsfeedReactionCounts(feed.reaction));
  const selectedReactionType = $derived(getSelectedNewsfeedReactionType(feed.reaction, author.id));

  onMount(() => {
    if (isActive) {
      const el = document.getElementById(feed.id);
      el?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
        inline: 'nearest'
      });
    }
  });
</script>

<div
  id={feed.id}
  class="bg-card text-card-foreground relative mb-6 flex w-full max-w-3xl flex-col overflow-visible rounded-xl {isActive
    ? 'ring-primary border-primary ring-2'
    : 'border-border/60 border'}"
>
  {#if feed.isPinned}
    <PinIcon
      size={24}
      class="ui:text-primary ui:fill-primary pointer-events-none absolute -top-3 -left-2 z-10 -rotate-40"
      aria-hidden="true"
    />
    <span class="sr-only">{$t('course.navItem.news_feed.pinned')}</span>
  {/if}

  <Header {feed} {onPin} onEdit={openEditFeed} onRequestDelete={() => (isDeleteFeedModal = true)} />

  <div class="px-4 pb-2">
    <NewsfeedReactions
      {reactionCounts}
      {selectedReactionType}
      disabled={isReacting || !author.id}
      onReactionToggle={handleReact}
    />
  </div>

  <Comments
    {courseId}
    {feed}
    {author}
    {comments}
    onAddComment={async (content, parentId, replyTo) => {
      await addNewComment(content, feed.id, parentId, replyTo);
    }}
    onDeleteComment={(commentId, parentId) => {
      if (courseId) deleteComment(feed.id, String(commentId), parentId);
    }}
  />

  <DeleteConfirmation bind:openDeleteModal={isDeleteFeedModal} deleteFeed={handleDeleteFeed} />
</div>
