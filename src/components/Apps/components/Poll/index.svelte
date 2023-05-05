<script>
  import PageNav from '../../../PageNav/index.svelte';
  import CloseButton from '../../../Buttons/Close/index.svelte';
  import PrimaryButton from '../../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../../PrimaryButton/constants';
  import CreatePollForm from './components/CreatePollForm.svelte';
  import Poll from './components/Poll.svelte';
  import Tabs from './components/Tabs.svelte';

  export let handleClose;

  const users = [
    {
      label: 'Rich Harris',
      value: 'rich-harris',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    {
      label: 'Linus Torvalds',
      value: 'linus-torvalds',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    {
      label: 'Elon Musk',
      value: 'elon-musk',
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
    {
      label: 'Satoshi Nakamoto',
      value: 'satoshi-nakamoto',
      avatar: 'https://i.pravatar.cc/150?img=4',
    },
  ];
  const tabs = [
    {
      label: 'My polls',
      value: 0,
    },
    {
      label: 'Other polls',
      value: 1,
    },
  ];

  let selectedTab = 0;
  let userId = users[0].value;
  let shouldCreatePoll = false;
  let polls = [
    {
      question: 'Who is the creator of Svelte?',
      author: users[0],
      status: 'draft', // public
      expiration: new Date().toDateString(),
      options: [
        {
          label: 'Dan Abrahmov',
          selectedBy: [],
        },
        {
          label: 'Evan You',
          selectedBy: [
            {
              label: 'Rich Harris',
              value: 'rich-harris',
              avatar: 'https://i.pravatar.cc/150?img=1',
            },
            {
              label: 'Linus Torvalds',
              value: 'linus-torvalds',
              avatar: 'https://i.pravatar.cc/150?img=2',
            },
          ],
        },
        {
          label: 'Rich Harris',
          selectedBy: [],
        },
        {
          label: 'Yehuda Katz',
          selectedBy: [],
        },
      ],
    },
  ];

  function handleCreatePoll() {
    shouldCreatePoll = !shouldCreatePoll;
  }

  function handlePollCreate(poll) {
    if (poll) {
      polls = [
        {
          ...poll,
          author: users.find((u) => u.value === userId),
        },
        ...polls,
      ];
    }

    handleCreatePoll();
  }

  function handlePollDelete(pollId) {
    return () => {
      polls = [...polls.filter((p, i) => i !== pollId)];
    };
  }

  function handleVote(pollId) {
    return (optionId) => {
      polls = [
        ...polls.map((poll, index) => {
          if (index === pollId) {
            poll.options = poll.options.map((option, optionIndex) => {
              if (optionIndex === optionId) {
                if (option.selectedBy.find((user) => user.value === userId)) {
                  // Unselect if already selected
                  // <<update: let me keep this commented so after a user selects an answer it can't be unselected>>
                  // option.selectedBy = option.selectedBy.filter(user => user.value !== userId)
                } else {
                  // Select if already selected
                  option.selectedBy = [
                    ...option.selectedBy,
                    users.find((user) => user.value === userId),
                  ];
                }
              } else if (
                option.selectedBy.find((user) => user.value === userId)
              ) {
                // This makes the user to select only one option
                option.selectedBy = option.selectedBy.filter(
                  (user) => user.value !== userId
                );
              }

              return option;
            });
          }

          return poll;
        }),
      ];
    };
  }
</script>

<PageNav title="Poll" overidableStyle="padding: 0 10px">
  <div slot="widget">
    <CloseButton onClick={handleClose} />
  </div>
</PageNav>

<div class="m-2 overlow-auto">
  {#if shouldCreatePoll}
    <CreatePollForm onSubmit={handlePollCreate} onCancel={handleCreatePoll} />
  {:else}
    <div>
      <Tabs {tabs} bind:selectedTab />

      {#if selectedTab === tabs[0].value}
        <div class="w-full flex justify-center mb-3">
          <PrimaryButton
            label="Create poll"
            variant={VARIANTS.CONTAINED}
            onClick={handleCreatePoll}
          />
        </div>
      {/if}

      {#each polls as poll, index}
        {#if selectedTab === tabs[0].value && poll.author.value === userId}
          <Poll
            bind:poll
            onSelect={handleVote(index)}
            handlePollDelete={handlePollDelete(index)}
            currentUserId={userId}
          />
        {:else if selectedTab === tabs[1].value && poll.author.value !== userId}
          <Poll
            bind:poll
            onSelect={handleVote(index)}
            handlePollDelete={handlePollDelete(index)}
            currentUserId={userId}
          />
        {/if}
      {:else}
        <div
          class="bg-gray-100 dark:bg-gray-700 border rounded-md h-60 flex items-center justify-center"
        >
          <h2 class="text-xl font-bold">No polls to display</h2>
        </div>
      {/each}
    </div>
  {/if}
</div>
