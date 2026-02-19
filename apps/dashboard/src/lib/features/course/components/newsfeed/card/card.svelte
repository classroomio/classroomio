<script lang="ts">
  import { onMount } from 'svelte';

  import type { Feed } from '$features/course/utils/types';
  import { newsfeedApi } from '$features/course/api';

  import DeleteConfirmation from './delete-confirmation.svelte';
  import type { NewsfeedCommentsByFeedId } from '$features/course/api';
  import Header from './header.svelte';
  import Reactions from './reactions.svelte';
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

  const openEditFeed = () => {
    newsfeedApi.openNewFeedModal();
    edit = true;

    if (edit === true) {
      editFeed = feed;
    }
  };

  const handleReact = (reactionType: string) => addNewReaction(reactionType, feed.id, author.id);

  const handleDeleteFeed = () => {
    deleteFeed(feed.id);
  };

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
  class="flex flex-col justify-between gap-2 {isActive
    ? 'border-primary-700 border-2'
    : 'border border-gray-200'} mb-7 w-[90%] rounded-md md:max-w-3xl"
>
  <Header {feed} {onPin} onEdit={openEditFeed} onRequestDelete={() => (isDeleteFeedModal = true)} />

  <Reactions {feed} authorId={author.id} {isReacting} onReact={handleReact} />

  <Comments
    {courseId}
    {feed}
    {author}
    {comments}
    onAddComment={async (content) => {
      await addNewComment(content, feed.id);
    }}
    onDeleteComment={(commentId) => {
      if (courseId) deleteComment(feed.id, String(commentId));
    }}
  />

  <DeleteConfirmation bind:openDeleteModal={isDeleteFeedModal} deleteFeed={handleDeleteFeed} />
</div>
