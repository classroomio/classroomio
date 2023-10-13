<script lang="ts">
  import PageNav from '$lib/components/PageNav/index.svelte';
  import CloseButton from '$lib/components/Buttons/Close/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import CreatePollForm from './components/CreatePollForm.svelte';
  import Poll from './components/Poll.svelte';
  import Tabs from './components/Tabs.svelte';
  import { polls } from './store';
  import type { IPoll, ITabs } from './types';
  import RoleBaseSecurity from '$lib/components/RoleBasedSecurity/index.svelte';

  export let handleClose = () => {};
  let selectedTab = 0;
  let userId = 'abcdefghijk';
  let shouldCreatePoll = false;
  let myPolls = 0;
  let otherPolls = 0;

  let tabs: ITabs = [];

  function handleCreatePoll() {
    shouldCreatePoll = !shouldCreatePoll;
  }

  function handlePollCreate(poll: IPoll) {
    if (poll) {
      $polls = [
        {
          ...poll,
          id: 'a',
          author: {
            id: 'abcdefghijk',
            label: 'Satoshi Nakamoto',
            fullname: 'satoshi-nakamoto',
            avatarUrl: 'https://i.pravatar.cc/150?img=4'
          }
        },
        ...$polls
      ];
    }

    handleCreatePoll();
  }

  function handlePollDelete(pollId: string) {
    return () => {
      $polls = [...$polls.filter((p, i) => p.id !== pollId)];
    };
  }

  function handleVote(pollId: string | number) {
    return (optionId: string | number) => {
      $polls = [
        ...$polls.map((poll, index) => {
          if (index === pollId) {
            poll.options = poll.options.map((option, optionIndex) => {
              if (optionIndex === optionId) {
                if (option.selectedBy.find((user) => user.id === userId)) {
                  // Unselect if already selected
                  // <<update: let me keep this commented so after a user selects an answer it can't be unselected>>
                  // option.selectedBy = option.selectedBy.filter(user => user.value !== userId)
                } else {
                  // Select if already selected
                  option.selectedBy = [
                    ...option.selectedBy,
                    {
                      id: 'abcdefghijk',
                      label: 'Satoshi Nakamoto',
                      fullname: 'satoshi-nakamoto',
                      avatarUrl: 'https://i.pravatar.cc/150?img=4'
                    }
                  ];
                }
              } else if (option.selectedBy.find((user) => user.id === userId)) {
                // This makes the user to select only one option
                option.selectedBy = option.selectedBy.filter((user) => user.id !== userId);
              }

              return option;
            });
          }

          return poll;
        })
      ];
    };
  }
  $: {
    myPolls = $polls.filter((poll) => poll.author.id === userId).length;
    otherPolls = $polls.filter((poll) => poll.author.id !== userId).length;
    tabs = [
      {
        label: 'My polls',
        value: 0,
        number: myPolls
      },
      {
        label: 'Other polls',
        value: 1,
        number: otherPolls
      }
    ];
  }
</script>

<PageNav title="Poll" overidableStyle="padding: 0 10px">
  <div slot="widget">
    <CloseButton onClick={handleClose} />
  </div>
</PageNav>

<div class="m-2 overlow-y-auto md:min-w-[350px] w-full">
  {#if shouldCreatePoll}
    <CreatePollForm onSubmit={handlePollCreate} onCancel={handleCreatePoll} />
  {:else}
    <div>
      <Tabs {tabs} bind:selectedTab />
      <RoleBaseSecurity allowedRoles={[1, 2]}>
        {#if selectedTab === tabs[0].value}
          <div class="w-full flex justify-center mb-3">
            <PrimaryButton
              label="Create poll"
              variant={VARIANTS.CONTAINED}
              onClick={handleCreatePoll}
            />
          </div>
        {/if}
      </RoleBaseSecurity>

      {#each $polls as poll, index}
        {#if selectedTab === tabs[0].value && poll.author.id === userId}
          <Poll
            bind:poll
            onSelect={handleVote(index)}
            handlePollDelete={handlePollDelete(poll.id)}
            currentUserId={userId}
          />
        {:else if selectedTab === tabs[1].value && poll.author.id !== userId}
          <Poll
            bind:poll
            onSelect={handleVote(index)}
            handlePollDelete={handlePollDelete(poll.id)}
            currentUserId={userId}
          />
        {/if}
      {/each}
      {#if selectedTab === tabs[0].value && myPolls == 0}
        <div
          class="bg-gray-100 dark:bg-neutral-800 border rounded-md h-60 flex items-center justify-center"
        >
          <h2 class="text-xl font-bold">No polls to display</h2>
        </div>
      {/if}
      {#if selectedTab === tabs[1].value && otherPolls == 0}
        <div
          class="bg-gray-100 dark:bg-neutral-800 border rounded-md h-60 flex items-center justify-center"
        >
          <h2 class="text-xl font-bold">No polls to display</h2>
        </div>
      {/if}
    </div>
  {/if}
</div>
