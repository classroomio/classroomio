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

  export let value: Feed | any = {};
  export let editValue: Feed | any = {};
  export let author: Author | any = {};
  export let edit = false;
  export let deleteFeed = (arg: string) => {};
  export let deleteComment = (arg: string) => {};
  export let addNewComment = (arg1: string, arg2: string, arg3: string) => {};
  export let addNewReaction = (arg1: string, arg2: string, arg3: string) => {};

  let comment = '';
  let areCommentsExpanded = false;
  let isDeleteFeedModal = false;

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
      editValue = value;
    }
  };
  const expandComment = () => {
    areCommentsExpanded = !areCommentsExpanded;
  };

  const handleAddNewReaction = (reactionType: string) => {
    addNewReaction(reactionType, value.id, author.id);
  };

  const handleAddNewComment = (event) => {
    if (event.key === 'Enter' || event.type === 'click') {
      event.preventDefault();
      addNewComment(comment, value.id, author.id);
      comment = '';
    }
  };

  const handleDeleteFeed = () => {
    deleteFeed(value.id);
  };

  const handleDeleteComment = (id: string) => {
    deleteComment(id);
  };

  function isNoteEmpty(note: string) {
    if (!note || typeof note !== 'string') return true;

    if (!document) return false;

    const dummyDiv = document.createElement('div');
    dummyDiv.innerHTML = note;

    const rawText = dummyDiv.textContent?.trim();

    return rawText === '';
  }
</script>

<div class="flex flex-col gap-5 border-2 border-gray-200 rounded-md my-5">
  <section>
    <div class="p-3">
      <div class="flex justify-between mb-2">
        <span class="flex items-center gap-3">
          <div class="w-9 h-9">
            <img
              src={value.author?.profile.avatar_url}
              alt="users banner"
              class="w-full h-full rounded-full object-cover"
            />
          </div>
          <span>
            <p class="text-base font-semibold capitalize">{value.author?.profile.fullname}</p>
            <p class="text-sm font-medium text-gray-600">{calDateDiff(value.created_at)}</p>
          </span>
        </span>
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          <OverflowMenu flipped>
            <OverflowMenuItem text="Edit" on:click={openEditFeed} />
            <OverflowMenuItem danger text="Delete" on:click={() => (isDeleteFeedModal = true)} />
          </OverflowMenu>
        </RoleBasedSecurity>
      </div>
      {#if !isNoteEmpty(value.content)}
        <HtmlRender className="text-sm font-medium w-[80%] mb-4">
          <svelte:fragment slot="content">
            <div>
              {@html value.content}
            </div>
          </svelte:fragment>
        </HtmlRender>
      {/if}
    </div>

    <div class="flex gap-4 px-3">
      <div class="flex gap-4 px-3">
        {#each Object.keys(value.reaction) as reactionType}
          {#if reactions[reactionType]}
            <button
              on:click={() => handleAddNewReaction(reactionType)}
              class={`flex transition ${
                value.reaction[reactionType].length >= 1 &&
                'bg-sky-50 px-1 border border-sky-600 rounded-full'
              }`}
            >
              <div class="text-[15px]">{reactions[reactionType]}</div>
              {#if value.reaction[reactionType].length >= 1}
                <Chip value={value.reaction[reactionType].length} className="bg-transparent" />
              {/if}
            </button>
          {/if}
        {/each}
      </div>
    </div>
  </section>

  <section class="border-t-2 border-gray-200 p-3">
    {#if value.comment.length > 0}
      <button
        on:click={expandComment}
        class="flex flex-row items-center gap-1 -mx-2 px-2 hover:bg-slate-200 rounded-md"
      >
        <UserMultiple size={16} />
        <p class="text-sm py-2">
          {value.comment.length} class {value.comment.length > 1 ? 'comments' : 'comment'}
        </p>
      </button>
    {/if}
    <div>
      {#each value.comment as comment, index}
        {#if comment.content && (areCommentsExpanded || index === value.comment.length - 1)}
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
          src={author.avatar}
          alt="users banner"
          class="w-full h-full rounded-full object-cover"
        />
      </div>
      <div class="flex-1">
        <input
          type="text"
          value={comment}
          on:input={(e) => (comment = e.target?.value)}
          on:keydown={(e) => handleAddNewComment(e)}
          placeholder="Add class comment"
          class="w-full bg-transparent border-2 border-gray-200 rounded-3xl"
        />
      </div>
      <button on:click={(e) => handleAddNewComment(e)}>
        <Send size={24} />
      </button>
    </div>
  </section>
  <DeleteFeedConfirmation bind:openDeleteModal={isDeleteFeedModal} deleteFeed={handleDeleteFeed} />
</div>
