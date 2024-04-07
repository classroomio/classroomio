<script lang="ts">
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Label from './Label.svelte';
  import Avatar from './Avatar.svelte';
  import type { PollType } from '../types';
  import { updatePollStatus } from '../service';

  export let poll: PollType;
  export let onSelect: (a: string) => void;
  export let handlePollDelete = () => {};
  export let currentUserId: number | string;

  let viewResult = false;
  let selectedOptionToView: { selectedBy: PollType['options'][0]['selectedBy'] } | null;
  let isAuthor = false;
  let totalVotes = 0;
  let isThereAnyVote = false;

  function getTotalVotes(options: PollType['options']) {
    return options.reduce((acc, cur) => acc + cur.selectedBy.length, 0);
  }

  function calculatePercent(
    options: PollType['options'],
    currentOption: { selectedBy: string | PollType['options'][0]['selectedBy'] }
  ) {
    const totalVoteOfAllOptions = getTotalVotes(options);
    const totalVotesOfCurrentOption = currentOption.selectedBy.length;

    return Math.round((totalVotesOfCurrentOption / totalVoteOfAllOptions) * 100) || 0;
  }

  function didUserSelect(
    option: { selectedBy: PollType['options'][0]['selectedBy'] },
    userId: number | string
  ) {
    return option.selectedBy.find((user) => user.id === userId);
  }

  let prevStatus = poll.status;
  function onStatusChange(status: string) {
    if (status === prevStatus || !status) return;

    updatePollStatus(poll.id, status);
    prevStatus = status;
  }

  $: onStatusChange(poll.status);
  $: isAuthor = currentUserId === poll.author.id;
  $: totalVotes = getTotalVotes(poll.options);
  $: {
    isThereAnyVote = poll?.options?.some((option) => option.selectedBy.length) || false;
  }
</script>

<div class="p-4 flex-wrap bg-white dark:bg-black border-2 rounded-md mb-3 w-full">
  {#if selectedOptionToView}
    <div>
      <div class="flex items-center mb-5">
        <button class="text-xl w-10 px-3" on:click={() => (selectedOptionToView = null)}>
          {`<`}
        </button>
        <div class="flex-grow text-center">
          <h3 class="dark:text-white font-bold">Voted</h3>
        </div>
      </div>
      {#each selectedOptionToView.selectedBy as user}
        <div class="flex items-center mb-2">
          <Avatar src={user.avatarUrl} name={user.username} className="mr-2" />
          <p class="dark:text-white">
            {user.fullname}
          </p>
        </div>
      {/each}
    </div>
  {:else}
    <div class="flex flex-wrap gap-2 mb-3 justify-between">
      <div>
        <h3 class="dark:text-white font-bold">
          {poll.question}
        </h3>
        <p class="dark:text-white text-sm italic">
          Created by <span class="text-primary-500">@{poll.author.username}</span>
        </p>
      </div>

      {#if isAuthor}
        <div class="flex mb-3 justify-end items-center">
          <label class="mr-2 font-bold" for="user-select">Status:</label>

          <select
            name="users"
            id="user-select"
            class="dark:text-white dark:bg-black"
            bind:value={poll.status}
          >
            <option value="draft">Draft</option>
            <option value="published">Publish</option>
          </select>
        </div>
      {/if}
    </div>

    {#if viewResult}
      <div class="flex items-center justify-between">
        <div class="mr-5">
          <Label>Expiration</Label>
          <p class="dark:text-white text-sm text-gray-600 mb-4">
            {poll.expiration || 'Today'}
          </p>
        </div>
        <div class="flex flex-col items-center">
          <Label>Total Votes</Label>
          <p class="dark:text-white text-sm text-gray-600 mb-4">
            {totalVotes}
          </p>
        </div>
      </div>

      <Label>Responses</Label>
      {#each poll.options as option}
        <div class="border-b p-5">
          <p class="dark:text-white">
            {option.label}
          </p>

          <div class="flex items-center">
            <div class="w-4/5 h-2 bg-gray-200 relative">
              <span
                class="absolute top-0 left-0 bg-primary-700 h-full"
                style="width: {calculatePercent(poll.options, option)}%;"
              />
            </div>
            {#if option.selectedBy.length}
              <button class="text-xl px-3 ml-5" on:click={() => (selectedOptionToView = option)}>
                >
              </button>
            {/if}
          </div>

          <div class="flex items-center">
            {#each option.selectedBy.slice(0, 3) as user}
              <Avatar src={user.avatarUrl} name={user.username} className="mr-2" />
            {/each}
          </div>
        </div>
      {/each}
    {:else}
      {#each poll.options as option, index}
        <button
          class="bg-white dark:bg-black rounded-md border-2 border-gray-100 dark:border-neutral-600 h-[50px] {didUserSelect(
            option,
            currentUserId
          ) &&
            'focus:border-primary-700 border-primary-700'} text-black dark:text-white p-2 w-full mb-3 text-left relative"
          on:click={() => onSelect(option.id)}
        >
          {#if isThereAnyVote}
            <span
              class="progress absolute top-0 text-black left-0 {didUserSelect(option, currentUserId)
                ? 'bg-primary-700'
                : 'bg-gray-300'} h-full bg-opacity-25"
              style="width: {calculatePercent(poll.options, option)}%;"
            />
          {/if}
          <p
            class="absolute top-3 {didUserSelect(option, currentUserId)
              ? 'text-white'
              : 'dark:text-white text-black'} left-2"
          >
            {option.label}
            ({calculatePercent(poll.options, option)}%)
          </p>
        </button>
      {/each}
      <div class="flex items-center">
        <p class="dark:text-white text-sm text-gray-600">
          Expires: {poll.expiration || 'Today'}
        </p>
        <span class="mx-2">|</span>
        <p class="dark:text-white text-sm text-gray-600">
          Voted: {totalVotes}
        </p>
      </div>
    {/if}

    {#if isAuthor}
      <div class="w-full flex items-center mt-3">
        <PrimaryButton
          label={viewResult ? 'Back' : 'Result'}
          onClick={() => (viewResult = !viewResult)}
        />
        <PrimaryButton label="Delete" variant={VARIANTS.TEXT_DANGER} onClick={handlePollDelete} />
      </div>
    {/if}
  {/if}
</div>

<style>
  .progress {
    transition: width 0.5s linear;
  }
</style>
