<script lang="ts">
  import OverflowMenuVertical from 'carbon-icons-svelte/lib/OverflowMenuVertical.svelte';
  import Send from 'carbon-icons-svelte/lib/Send.svelte';
  import Chip from '$lib/components/Chip/index.svelte';
  import UserMultiple from 'carbon-icons-svelte/lib/UserMultiple.svelte';
  import { calDateDiff } from '$lib/utils/functions/date';
  import type { Author, Feed } from '$lib/utils/types/feed';

  export let value: Feed | any = {};
  export let author: Author | any = {};
  export let deleteFeed = (arg: string) => {};
  export let deleteComment = (arg: string) => {};
  export let addNewComment = (arg1: string, arg2: string, arg3: string) => {};
  export let addNewReaction = (arg1: string, arg2: string, arg3: string) => {};

  let isFeedOptionOpen = false;
  let isCommentOptionOpen = false;
  let comment = '';
  let areCommentsExpanded = false;

  let reactions = {
    smile: '😀',
    thumbsup: '👍',
    thumbsdown: '👎',
    clap: '👏'
  };

  const expandComment = () => {
    areCommentsExpanded = !areCommentsExpanded;
  };

  const toggleOption = (option: string) => {
    if (option === 'feed') {
      isFeedOptionOpen = !isFeedOptionOpen;
    } else if (option === 'comment') {
      isCommentOptionOpen = !isCommentOptionOpen;
    }
  };

  const handleAddNewReaction = (reactionType: string) => {
    addNewReaction(reactionType, value.id, value.author_id);
  };

  const handleAddNewComment = (event) => {
    if (event.key === 'Enter' || event.type === 'click') {
      event.preventDefault();
      addNewComment(comment, value.id, value.author_id);
      comment = '';
    }
  };

  const handleDeleteFeed = () => {
    deleteFeed(value.id);
    isFeedOptionOpen = false;
  };

  const handleDeleteComment = (id: string) => {
    deleteComment(id);
    isCommentOptionOpen = false;
  };
</script>

<div class="flex flex-col gap-5 border-2 border-gray-200 rounded-md my-5">
  <section>
    <div class="p-3">
      <div class="flex justify-between mb-2">
        <span class="flex items-center gap-3">
          <div class="w-9 h-9">
            <img
              src={value.author.avatar}
              alt="users banner"
              class="w-full h-full rounded-full object-cover"
            />
          </div>
          <span>
            <p class="text-base font-semibold capitalize">{value.author.fullname}</p>
            <p class="text-sm font-medium text-gray-600">{calDateDiff(value.created_at)}</p>
          </span>
        </span>
        <div class="relative">
          <button on:click={() => toggleOption('feed')}>
            <OverflowMenuVertical size={24} />
          </button>

          {#if isFeedOptionOpen == true}
            <div class="absolute right-2 rounded-md p-2 border hover:bg-slate-200 cursor-pointer">
              <button on:click={() => handleDeleteFeed()}>
                <p>Delete</p>
              </button>
            </div>
          {/if}
        </div>
      </div>
      <p class="text-sm font-medium w-[80%] mb-4">{value.content}</p>
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
                  src={comment.author.avatar}
                  alt="users banner"
                  class="w-full h-full rounded-full object-cover"
                />
              </div>
              <span>
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium capitalize">{comment.author.fullname}</p>
                  <p class="text-xs font-medium text-gray-600">{calDateDiff(comment.created_at)}</p>
                </div>
                <p>{comment.content}</p>
              </span>
            </span>

            <div class="relative opacity-0 group-hover:opacity-100">
              <button on:click={() => toggleOption('comment')}>
                <OverflowMenuVertical size={24} />
              </button>

              {#if isCommentOptionOpen == true}
                <div
                  class="absolute right-2 rounded-md p-2 border hover:bg-slate-200 cursor-pointer"
                >
                  <button on:click={() => handleDeleteComment(comment.id)}>
                    <p>Delete</p>
                  </button>
                </div>
              {/if}
            </div>
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
</div>
