<script lang="ts">
  import PageNav from '$lib/components/PageNav/index.svelte';
  import CloseButton from '$lib/components/Buttons/Close/index.svelte';
  import CreatePollForm from './components/CreatePollForm.svelte';
  import Poll from './components/Poll.svelte';
  import Tabs from './components/Tabs.svelte';
  import { polls } from './store';
  import type { PollType, TabsType, PollOptionType } from './types';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { profile } from '$lib/utils/store/user';
  import { group, course } from '$lib/components/Course/store';
  import type { Groupmember } from '$lib/utils/types';
  import { fetchPolls } from '$lib/utils/services/apps';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { onMount } from 'svelte';

  export let handleClose = () => {};

  const supabase = getSupabase();

  let selectedTab = 0;
  let currentGroupMember: Groupmember | undefined;
  let openCreatePollForm = false;
  let isCreating = false;

  let tabs: TabsType = [];

  async function createPoll(poll: PollType) {
    if (!currentGroupMember || !$course.id) return;

    const { data, error } = await supabase
      .from('apps_poll')
      .insert({
        question: poll.question,
        authorId: currentGroupMember.id,
        isPublic: poll.isPublic,
        status: poll.question,
        expiration: poll.expiration
      })
      .select('id');

    if (error || !data) {
      console.log(error);
      snackbar.error('An error occurred while creating poll');
      return;
    }

    const pollId = data[0].id;
    const appsPollOptions = poll.options.map((option) => ({
      poll_id: pollId,
      label: option.label
    }));
    const { data: appsPollOptionsData, error: appsPollOptionsError } = await supabase
      .from('apps_poll_option')
      .insert(appsPollOptions)
      .select();

    if (appsPollOptionsError || !appsPollOptionsData) {
      console.log({ appsPollOptionsError });
      snackbar.error('An error occurred while creating poll');
      return;
    }

    $polls = [
      ...$polls,
      {
        ...poll,
        id: pollId,
        courseId: $course.id,
        author: {
          id: currentGroupMember.id,
          username: $profile.username,
          fullname: $profile.fullname,
          avatarUrl: $profile.avatar_url
        },
        options: appsPollOptionsData.map((option) => ({
          ...option,
          id: option.id,
          selectedBy: []
        }))
      }
    ];

    $course.appsPollCount = [{ count: $polls.length }];
  }

  async function handlePollCreate(poll: PollType) {
    if (!currentGroupMember) return;

    isCreating = true;
    await createPoll(poll);
    isCreating = false;

    openCreatePollForm = false;
  }

  function handlePollDelete(pollId: string) {
    return async () => {
      await supabase.from('apps_poll').delete().match({ id: pollId });
      await supabase.from('apps_poll_option').delete().match({ poll_id: pollId });

      $polls = [...$polls.filter((p, i) => p.id !== pollId)];

      $course.appsPollCount = [{ count: $polls.length }];
    };
  }

  function handleVote(pollId: string | number) {
    return (optionId: string | number) => {
      $polls = [
        ...$polls.map((poll, index) => {
          if (index === pollId) {
            poll.options = poll.options.map(
              (option: PollOptionType, optionIndex: string | number) => {
                if (optionIndex === optionId) {
                  if (
                    option.selectedBy.find(
                      (gmember: { id: string }) => gmember.id === currentGroupMember?.id
                    )
                  ) {
                    // Unselect if already selected
                    // <<update: let me keep this commented so after a groupmember selects an answer it can't be unselected>>
                    // option.selectedBy = option.selectedBy.filter(gmember => gmember.id !== currentGroupMember?.id)
                  } else {
                    // Select if already selected
                    if (currentGroupMember) {
                      option.selectedBy = [
                        ...option.selectedBy,
                        {
                          id: currentGroupMember.id,
                          username: $profile.username,
                          fullname: $profile.fullname,
                          avatarUrl: $profile.avatar_url
                        }
                      ];
                    }
                  }
                } else if (
                  option.selectedBy.find((gmember) => gmember.id === currentGroupMember?.id)
                ) {
                  // This makes the groupmember to select only one option
                  option.selectedBy = option.selectedBy.filter(
                    (gmember) => gmember.id !== currentGroupMember?.id
                  );
                }

                return option;
              }
            );
          }

          return poll;
        })
      ];
    };
  }

  onMount(async () => {
    if (!$course.id) return;

    const { data, error } = await fetchPolls($course.id);

    if (!data || error) {
      console.log(error);
      return;
    }

    const pollsData: PollType[] = data.map((appsPollItem) => ({
      id: appsPollItem.id,
      courseId: appsPollItem.courseId,
      expiration: appsPollItem.expiration,
      status: appsPollItem.status,
      question: appsPollItem.question,
      isPublic: appsPollItem.isPublic,
      author: {
        id: appsPollItem.authorId,
        username: appsPollItem.author.profile.username,
        fullname: appsPollItem.author.profile.fullname,
        avatarUrl: appsPollItem.author.profile.avatar_url
      },
      options: appsPollItem.options.map((option) => ({
        id: option.id,
        label: option.label,
        selectedBy: []
      }))
    }));
    polls.set(pollsData);
  });

  $: currentGroupMember = $group.people.find((person) => person.profile_id === $profile.id);
  $: {
    tabs = [
      {
        label: 'Active polls',
        value: 0,
        number: $polls.filter((poll) => new Date(poll.expiration) >= new Date()).length
      },
      {
        label: 'Expired polls',
        value: 1,
        number: $polls.filter((poll) => new Date(poll.expiration) <= new Date()).length
      }
    ];
  }
</script>

<PageNav title="Poll" overidableStyle="padding: 0 10px">
  <div slot="widget">
    <CloseButton onClick={handleClose} />
  </div>
</PageNav>

<div class="p-2 overlow-y-auto md:min-w-[350px] w-full">
  {#if openCreatePollForm}
    <CreatePollForm
      onSubmit={handlePollCreate}
      onCancel={() => (openCreatePollForm = !openCreatePollForm)}
      bind:isSaving={isCreating}
    />
  {:else}
    <div>
      <Tabs {tabs} bind:selectedTab onCreate={() => (openCreatePollForm = !openCreatePollForm)} />

      {#each $polls as poll, index}
        {#if selectedTab === tabs[0].value}
          <Poll
            bind:poll
            onSelect={handleVote(index)}
            handlePollDelete={handlePollDelete(poll.id)}
            currentUserId={currentGroupMember?.id || ''}
          />
        {:else if selectedTab === tabs[1].value}
          <Poll
            bind:poll
            onSelect={handleVote(index)}
            handlePollDelete={handlePollDelete(poll.id)}
            currentUserId={currentGroupMember?.id || ''}
          />
        {/if}
      {:else}
        <div
          class="bg-gray-100 dark:bg-neutral-800 border rounded-md h-60 flex items-center justify-center"
        >
          <h2 class="text-xl font-bold">No polls to display</h2>
        </div>
      {/each}
    </div>
  {/if}
</div>
