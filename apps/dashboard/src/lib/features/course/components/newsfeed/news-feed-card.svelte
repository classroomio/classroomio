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
  import type { Feed } from '$features/course/utils/types';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { sanitizeHtml } from '@cio/ui/tools/sanitize';
  import { addNewsfeedCommentValidation } from '$lib/utils/functions/validator';
  import { newsfeedApi } from '$features/course/api';

  import { Chip } from '@cio/ui/custom/chip';
  import DeleteFeedConfirmation from './delete-feed-confirmation.svelte';
  import { HTMLRender } from '$features/ui';
  import { RoleBasedSecurity } from '$features/ui';
  import type { NewsfeedCommentsByFeedId } from '$features/course/api';

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
    newsfeedApi.openNewFeedModal();
    edit = true;

    if (edit === true) {
      editFeed = feed;
    }
  };

  const expandComment = async () => {
    if (!areCommentsExpanded && courseId && comments && comments.items.length === 0 && comments.totalCount > 0) {
      // Load comments when expanding for the first time
      await newsfeedApi.getComments(courseId, feed.id);
    }
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
      addNewComment(comment, feed.id);
      comment = '';
    }
  };

  const handleDeleteFeed = () => {
    deleteFeed(feed.id);
  };

  const handleDeleteComment = (id: string | number) => {
    if (courseId) {
      deleteComment(feed.id, String(id));
    }
  };

  const handleLoadMoreComments = async () => {
    if (courseId && comments?.hasMore && !comments.isLoading) {
      await newsfeedApi.loadMoreComments(courseId, feed.id);
    }
  };

  const getClassIfSelectedByAuthor = (reactionType) => {
    const usersReacted = (feed.reaction?.[reactionType] as string[]) || [];
    const feedAuthorId = (feed as any).authorProfileId || '';

    return usersReacted.includes(author.id) || usersReacted.includes(feedAuthorId)
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
    : 'border border-gray-200'} mb-7 max-w-3xl rounded-md"
>
  <section>
    <div class="p-3 pb-0">
      <div class="mb-2 flex justify-between">
        <span class="flex items-center gap-3">
          <div class="h-9 w-9">
            <img
              src={(feed as any).authorAvatarUrl || ''}
              alt="users banner"
              class="h-full w-full rounded-full object-cover"
            />
          </div>
          <span>
            <p class="text-base font-semibold capitalize">{(feed as any).authorFullname || ''}</p>
            <p class="text-sm font-medium text-gray-600">{calDateDiff(feed.createdAt)}</p>
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
      {#if !isHtmlValueEmpty(feed.content || '')}
        <HTMLRender className="text-sm font-medium w-[80%] mb-4">
          <div>
            {@html sanitizeHtml(feed.content || '')}
          </div>
        </HTMLRender>
      {/if}
    </div>

    <div class="flex items-center gap-4 px-3">
      <div class="flex items-center gap-4 px-3">
        {#each Object.keys(feed.reaction || {}) as reactionType}
          {#if reactions[reactionType]}
            <button
              onclick={() => handleAddNewReaction(reactionType)}
              class={`flex items-center transition ${
                feed.reaction?.[reactionType]?.length >= 1 &&
                `${getClassIfSelectedByAuthor(reactionType)} rounded-full border dark:text-black`
              }`}
            >
              <div class="text-[15px]">{reactions[reactionType]}</div>
              {#if feed.reaction?.[reactionType]?.length >= 1}
                <Chip value={feed.reaction?.[reactionType]?.length} className="bg-transparent" />
              {/if}
            </button>
          {/if}
        {/each}
      </div>
    </div>
  </section>

  <section class="border-t border-gray-200 p-3">
    {#if comments && comments.totalCount > 0}
      <button onclick={expandComment} class="-mx-2 flex flex-row items-center gap-1 rounded-md px-2">
        <UsersIcon size={16} />
        <p class="py-2 text-sm">
          {pluralize('comment', comments.totalCount, true)}
        </p>
      </button>
    {/if}
    <div>
      {#if comments}
        {#each comments.items as commentItem, index}
          {#if commentItem.content && (areCommentsExpanded || index === comments.items.length - 1)}
            <div class="group flex items-center justify-between py-2">
              <span class="flex items-center gap-3">
                <div class="h-9 w-9">
                  <img
                    src={(commentItem as any).authorAvatarUrl || ''}
                    alt="users banner"
                    class="h-full w-full rounded-full object-cover"
                  />
                </div>
                <span>
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium capitalize">{(commentItem as any).authorFullname || ''}</p>
                    <p class="text-xs font-medium text-gray-600">{calDateDiff(commentItem.createdAt)}</p>
                  </div>
                  <p>{commentItem.content}</p>
                </span>
              </span>

              {#if (commentItem as any).authorProfileId === $profile.id || $isOrgAdmin}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class="hidden h-8 w-8 items-center justify-center rounded-md group-hover:flex hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    <EllipsisVerticalIcon class="h-5 w-5" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content align="end">
                    <DropdownMenu.Item class="text-red-600" onclick={() => handleDeleteComment(commentItem.id)}>
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              {/if}
            </div>
          {/if}
        {/each}
        {#if comments.hasMore}
          <button
            onclick={handleLoadMoreComments}
            disabled={comments.isLoading}
            class="text-primary-600 hover:text-primary-700 mt-2 text-sm disabled:opacity-50"
          >
            {comments.isLoading ? 'Loading...' : `View ${comments.totalCount - comments.items.length} more comments`}
          </button>
        {/if}
      {/if}
    </div>
    <div class="flex items-center justify-between gap-2">
      <div class="h-7 w-7">
        <img src={author.avatarUrl} alt="users banner" class="h-full w-full rounded-full object-cover" />
      </div>
      <div class="flex-1">
        <input
          type="text"
          bind:value={comment}
          onkeydown={handleAddNewComment}
          placeholder="Add class comment"
          class="w-full rounded-3xl border border-gray-200 bg-transparent"
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
