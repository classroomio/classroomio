<script lang="ts">
  import { onMount } from 'svelte';
  import pluralize from 'pluralize';
  import UsersIcon from '@lucide/svelte/icons/users';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import SendHorizontalIcon from '@lucide/svelte/icons/send-horizontal';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';

  import { profile } from '$lib/utils/store/user';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { calDateDiff } from '$lib/utils/functions/date';
  import type { Author, Feed } from '$lib/utils/types/feed';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { addNewsfeedCommentValidation } from '$lib/utils/functions/validator';
  import { isNewFeedModal } from '$lib/components/Course/components/NewsFeed/store';

  import { Chip } from '@cio/ui/custom/chip';
  import DeleteFeedConfirmation from './DeleteFeedConfirmation.svelte';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import { RoleBasedSecurity } from '$features/ui';

  interface Props {
    feed: Feed;
    editFeed: Feed | null;
    author: Author;
    edit?: boolean;
    deleteFeed?: any;
    deleteComment?: any;
    addNewComment?: any;
    addNewReaction?: any;
    onPin?: any;
    isActive?: boolean;
  }

  let {
    feed,
    editFeed = $bindable(),
    author,
    edit = $bindable(false),
    deleteFeed = (_arg: string) => {},
    deleteComment = (_arg: string) => {},
    addNewComment = (_arg1: string, _arg2: string, _arg3: string) => {},
    addNewReaction = (_arg1: string, _arg2: string, _arg3: string) => {},
    onPin = (_feedId: Feed['id'], _isPinned: Feed['isPinned']) => {},
    isActive = false
  }: Props = $props();

  let comment = $state('');
  let areCommentsExpanded = $state(false);
  let isDeleteFeedModal = $state(false);
  let errors: {
    newComment: string;
  } = $state({
    newComment: ''
  });

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
      ? 'bg-primary-200 ui:border-primary pl-2'
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
    ? 'border-primary-700 border-2'
    : 'border border-gray-200 dark:border-neutral-600'} mb-7 max-w-3xl rounded-md"
>
  <section>
    <div class="p-3 pb-0">
      <div class="mb-2 flex justify-between">
        <span class="flex items-center gap-3">
          <div class="h-9 w-9">
            <img
              src={feed.author?.profile?.avatar_url}
              alt="users banner"
              class="h-full w-full rounded-full object-cover"
            />
          </div>
          <span>
            <p class="text-base font-semibold capitalize">{feed.author?.profile?.fullname}</p>
            <p class="text-sm font-medium text-gray-600">{calDateDiff(feed.created_at)}</p>
          </span>
        </span>
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              class="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700"
            >
              <EllipsisVerticalIcon class="h-5 w-5" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item onclick={() => onPin(feed.id, feed.isPinned)}>
                {feed.isPinned ? 'Unpin' : 'Pin'}
              </DropdownMenu.Item>
              <DropdownMenu.Item onclick={openEditFeed}>Edit</DropdownMenu.Item>
              <DropdownMenu.Item class="text-red-600" onclick={() => (isDeleteFeedModal = true)}>
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </RoleBasedSecurity>
      </div>
      {#if !isHtmlValueEmpty(feed.content)}
        <HtmlRender className="text-sm font-medium w-[80%] mb-4">
          <div>
            {@html feed.content}
          </div>
        </HtmlRender>
      {/if}
    </div>

    <div class="flex items-center gap-4 px-3">
      <div class="flex items-center gap-4 px-3">
        {#each Object.keys(feed.reaction) as reactionType}
          {#if reactions[reactionType]}
            <button
              onclick={() => handleAddNewReaction(reactionType)}
              class={`flex items-center transition ${
                feed.reaction[reactionType].length >= 1 &&
                `${getClassIfSelectedByAuthor(reactionType)} rounded-full border dark:text-black`
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

  <section class="border-t border-gray-200 p-3 dark:border-neutral-600">
    {#if feed.comment.length > 0}
      <button onclick={expandComment} class="-mx-2 flex flex-row items-center gap-1 rounded-md px-2">
        <UsersIcon size={16} />
        <p class="py-2 text-sm">
          {pluralize('comment', feed.comment.length, true)}
        </p>
      </button>
    {/if}
    <div>
      {#each feed.comment as comment, index}
        {#if comment.content && (areCommentsExpanded || index === feed.comment.length - 1)}
          <div class="group flex items-center justify-between py-2">
            <span class="flex items-center gap-3">
              <div class="h-9 w-9">
                <img
                  src={comment.author?.profile?.avatar_url}
                  alt="users banner"
                  class="h-full w-full rounded-full object-cover"
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
              <DropdownMenu.Root>
                <DropdownMenu.Trigger
                  class="hidden h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 group-hover:flex dark:hover:bg-neutral-700"
                >
                  <EllipsisVerticalIcon class="h-5 w-5" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Item class="text-red-600" onclick={() => handleDeleteComment(comment.id)}>
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
    <div class="flex items-center justify-between gap-2">
      <div class="h-7 w-7">
        <img src={author.avatar_url} alt="users banner" class="h-full w-full rounded-full object-cover" />
      </div>
      <div class="flex-1">
        <input
          type="text"
          bind:value={comment}
          onkeydown={handleAddNewComment}
          placeholder="Add class comment"
          class="w-full rounded-3xl border border-gray-200 bg-transparent dark:border-neutral-600"
          required
        />
      </div>
      <button onclick={handleAddNewComment}>
        <SendHorizontalIcon size={16} />
      </button>
    </div>
    {#if errors?.newComment}
      <p class="text-sm text-red-500">{errors?.newComment}</p>
    {/if}
  </section>
  <DeleteFeedConfirmation bind:openDeleteModal={isDeleteFeedModal} deleteFeed={handleDeleteFeed} />
</div>
