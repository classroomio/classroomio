<script lang="ts">
  import { OverflowMenu, OverflowMenuItem } from 'carbon-components-svelte';
  import Send from 'carbon-icons-svelte/lib/Send.svelte';
  import Chip from '$lib/components/Chip/index.svelte';
  import UserMultiple from 'carbon-icons-svelte/lib/UserMultiple.svelte';
  import { calDateDiff } from '$lib/utils/functions/date';
  import type { Author, Feed } from '$lib/utils/types/feed';
  import DeleteFeedConfirmation from './DeleteFeedConfirmation.svelte';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import { isNewFeedModal } from '$lib/components/Course/components/NewsFeed/store';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import pluralize from 'pluralize';
  import { onMount } from 'svelte';
  import { addNewsfeedCommentValidation } from '$lib/utils/functions/validator';

  export let feed: Feed;
  export let editFeed: Feed;
  export let author: Author;
  export let edit = false;
  export let deleteFeed = (arg: string) => {};
  export let deleteComment = (arg: string) => {};
  export let addNewComment = (arg1: string, arg2: string, arg3: string) => {};
  export let addNewReaction = (arg1: string, arg2: string, arg3: string) => {};
  export let onPin = (feedId: Feed['id'], isPinned: Feed['isPinned']) => {};
  export let isActive = false;

  let comment = '';
  let areCommentsExpanded = false;
  let isDeleteFeedModal = false;
  let errors: {
    newComment: string;
  };

  let reactions = {
    smile: '😀',
    thumbsup: '👍',
    thumbsdown: '👎',
    clap: '👏'
  };

  const openEditFeed = () => {
    $isNewFeedModal.open = true;
    edit = true;

    if (edit === true) {
      editFeed = feed;
    }
  };

  const expandComment = () => {
    areCommentsExpanded = !areCommentsExpanded;
  };

  const handleAddNewReaction = (reactionType: string) => {
    addNewReaction(reactionType, feed.id, author.id);
  };

  const handleAddNewComment = (event) => {
    if (event.key === 'Enter' || event.type === 'click') {
      errors = addNewsfeedCommentValidation(comment) as typeof errors;
      if (Object.keys(errors).length) {
        return;
      }
      event.preventDefault();
      addNewComment(comment, feed.id, author.id);
      comment = '';
    }
  };

  const handleDeleteFeed = () => {
    deleteFeed(feed.id);
  };

  const handleDeleteComment = (id: string) => {
    deleteComment(id);
  };

  const getClassIfSelectedByAuthor = (reactionType) => {
    const usersReacted = feed.reaction[reactionType] || [];

    return usersReacted.includes(author.id)
      ? 'bg-primary-200 border-primary-600 pl-2'
      : 'bg-gray-200 border-gray-600 pl-2';
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
  class="flex flex-col gap-5 {isActive
    ? 'border-2 border-primary-700'
    : 'border border-gray-200 dark:border-neutral-600'} rounded-md mb-7 max-w-3xl"
>
  <section>
    <div class="p-3 pb-0">
      <div class="flex justify-between mb-2">
        <span class="flex items-center gap-3">
          <div class="w-9 h-9">
            <img
              src={feed.author?.profile?.avatar_url}
              alt="users banner"
              class="w-full h-full rounded-full object-cover"
            />
          </div>
          <span>
            <p class="text-base font-semibold capitalize">{feed.author?.profile?.fullname}</p>
            <p class="text-sm font-medium text-gray-600">{calDateDiff(feed.created_at)}</p>
          </span>
        </span>
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <OverflowMenu flipped>
            <OverflowMenuItem
              text={feed.isPinned ? 'Unpin' : 'Pin'}
              on:click={() => onPin(feed.id, feed.isPinned)}
            />
            <OverflowMenuItem text="Edit" on:click={openEditFeed} />
            <OverflowMenuItem danger text="Delete" on:click={() => (isDeleteFeedModal = true)} />
          </OverflowMenu>
        </RoleBasedSecurity>
      </div>
      {#if !isHtmlValueEmpty(feed.content)}
        <HtmlRender className="text-sm font-medium w-[80%] mb-4">
          <svelte:fragment slot="content">
            <div>
              {@html feed.content}
            </div>
          </svelte:fragment>
        </HtmlRender>
      {/if}
    </div>

    <div class="flex items-center gap-4 px-3">
      <div class="flex items-center gap-4 px-3">
        {#each Object.keys(feed.reaction) as reactionType}
          {#if reactions[reactionType]}
            <button
              on:click={() => handleAddNewReaction(reactionType)}
              class={`flex items-center transition ${
                feed.reaction[reactionType].length >= 1 &&
                `${getClassIfSelectedByAuthor(reactionType)} dark:text-black border rounded-full`
              }`}
            >
              <div class="text-[15px]">{reactions[reactionType]}</div>
              {#if feed.reaction[reactionType].length >= 1}
                <Chip value={feed.reaction[reactionType].length} className="bg-transparent" />
              {/if}
            </button>
          {/if}
        {/each}
      </div>
    </div>
  </section>

  <section class="border-t border-gray-200 dark:border-neutral-600 p-3">
    {#if feed.comment.length > 0}
      <button
        on:click={expandComment}
        class="flex flex-row items-center gap-1 -mx-2 px-2 rounded-md"
      >
        <UserMultiple size={16} />
        <p class="text-sm py-2">
          {pluralize('comment', feed.comment.length, true)}
        </p>
      </button>
    {/if}
    <div>
      {#each feed.comment as comment, index}
        {#if comment.content && (areCommentsExpanded || index === feed.comment.length - 1)}
          <div class="group flex justify-between items-center py-2">
            <span class="flex items-center gap-3">
              <div class="w-9 h-9">
                <img
                  src={comment.author?.profile?.avatar_url}
                  alt="users banner"
                  class="w-full h-full rounded-full object-cover"
                />
              </div>
              <span>
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium capitalize">{comment.author?.profile?.fullname}</p>
                  <p class="text-xs font-medium text-gray-600">{calDateDiff(comment.created_at)}</p>
                </div>
                <p>{comment.content}</p>
              </span>
            </span>

            {#if comment.author?.profile?.id === $profile.id || $isOrgAdmin}
              <OverflowMenu flipped class="hidden group-hover:flex">
                <OverflowMenuItem
                  danger
                  text="Delete"
                  on:click={() => handleDeleteComment(comment.id)}
                />
              </OverflowMenu>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
    <div class="flex items-center justify-between gap-2">
      <div class="w-7 h-7">
        <img
          src={author.avatar_url}
          alt="users banner"
          class="w-full h-full rounded-full object-cover"
        />
      </div>
      <div class="flex-1">
        <input
          type="text"
          bind:value={comment}
          on:keydown={handleAddNewComment}
          placeholder="Add class comment"
          class="w-full bg-transparent border border-gray-200 dark:border-neutral-600 rounded-3xl"
          required
        />
      </div>
      <button on:click={handleAddNewComment}>
        <Send size={24} />
      </button>
    </div>
    {#if errors?.newComment}
      <p class="text-sm text-red-500">{errors?.newComment}</p>
    {/if}
  </section>
  <DeleteFeedConfirmation bind:openDeleteModal={isDeleteFeedModal} deleteFeed={handleDeleteFeed} />
</div>
