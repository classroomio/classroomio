<script>
  import Label from './Label.svelte';
  import Avatar from './Avatar.svelte';

  export let poll = {};
  export let onSelect = () => {};
  export let handlePollDelete = () => {};
  export let currentUserId;
  let viewResult = false;
  let selectedOptionToView;
  let isAuthor = false;
  let totalVotes = 0;
  let hasUserVoted = false;

  function handleSelect(optionIndex) {
    return () => {
      onSelect(optionIndex);
    };
  }

  function getSelectedUsers(users) {
    return users.map((o) => o.label).join(', ');
  }

  function getTotalVotes(options) {
    return options.reduce((acc, cur) => acc + cur.selectedBy.length, 0);
  }

  function calculatePercent(options, currentOption) {
    const totalVoteOfAllOptions = getTotalVotes(options);
    const totalVotesOfCurrentOption = currentOption.selectedBy.length;

    return Math.round((totalVotesOfCurrentOption / totalVoteOfAllOptions) * 100) || 0;
  }

  function didUserSelect(option) {
    return option.selectedBy.find((user) => user.value === currentUserId);
  }

  $: isAuthor = currentUserId === poll.author.value;
  $: totalVotes = getTotalVotes(poll.options);
  $: {
    hasUserVoted = poll.options.some((option) =>
      option.selectedBy.find((u) => u.value === currentUserId)
    );
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
          <Avatar src={user.avatar} name={user.label} className="mr-2" />
          <p class="dark:text-white">
            {user.label}
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
          Created by <a
            class="text-primary-500"
            href="https://twitter.com/rotimi_best"
            target="_blank">@{poll.author.label}</a
          >
        </p>
      </div>

      {#if isAuthor}
        <div class="flex mb-3 justify-end items-center">
          <label class="mr-2 font-bold" for="user-select">Status:</label>

          <select name="users" id="user-select" bind:value={poll.status}>
            <option value="draft">Draft</option>
            <option value="Public">Public</option>
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
      {#each poll.options as option, index}
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
              <Avatar src={user.avatar} name={user.label} className="mr-2" />
            {/each}
          </div>
        </div>
      {/each}
    {:else}
      {#each poll.options as option, index}
        <button
          class="bg-white dark:bg-black rounded-md border-2 border-gray-500 {didUserSelect(
            option
          ) &&
            'focus:border-primary-700 border-primary-700'} text-black p-2 w-full mb-3 text-left relative"
          on:click={handleSelect(index)}
        >
          {#if hasUserVoted}
            <span
              class="progress absolute top-0 left-0 {didUserSelect(option)
                ? 'bg-primary-700'
                : 'bg-gray-300'} h-full bg-opacity-25"
              style="width: {calculatePercent(poll.options, option)}%;"
            />
            <strong class="mr-3">{calculatePercent(poll.options, option)}%</strong>
          {/if}
          {option.label}
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
      <div class="w-full text-center mt-3">
        <button
          class="px-5 py-3 bg-primary-700 text-white"
          on:click={() => (viewResult = !viewResult)}
        >
          {#if viewResult}
            Back to poll
          {:else}
            View results
          {/if}
        </button>
        <button class="px-5 py-3 bg-red-500 text-white" on:click={handlePollDelete}>
          Delete
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .progress {
    transition: width 0.5s linear;
  }
</style>
