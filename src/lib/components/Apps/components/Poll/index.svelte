<script lang="ts">
  import PageNav from '$lib/components/PageNav/index.svelte';
  import CloseButton from '$lib/components/Buttons/Close/index.svelte';
  import CreatePollForm from './components/CreatePollForm.svelte';
  import Poll from './components/Poll.svelte';
  import Tabs from './components/Tabs.svelte';
  import { polls } from './store';
  import type { PollType, TabsType } from './types';
  import { apps } from '$lib/components/Apps/store';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { profile } from '$lib/utils/store/user';
  import { group, course } from '$lib/components/Course/store';
  import type { Groupmember } from '$lib/utils/types';
  import { fetchPolls, handleVote } from './service';
  import { getPollsData } from './utils';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { onMount } from 'svelte';

  export let handleClose = () => {};

  const supabase = getSupabase();

  let selectedTab = 0;
  let currentGroupMember: Groupmember | undefined;
  let openCreatePollForm = false;
  let isCreating = false;
  let isLoading = false;
  let author: PollType['author'] = {
    id: '',
    username: '',
    fullname: '',
    avatarUrl: ''
  };

  let tabs: TabsType = [];

  async function createPoll(poll: PollType) {
    if (!currentGroupMember || !$course.id) return;

    const { data, error } = await supabase
      .from('apps_poll')
      .insert({
        question: poll.question,
        authorId: currentGroupMember.id,
        status: poll.status,
        expiration: poll.expiration,
        courseId: $course.id
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
      {
        ...poll,
        id: pollId,
        courseId: $course.id,
        author,
        options: appsPollOptionsData.map((option) => ({
          ...option,
          id: option.id,
          selectedBy: []
        }))
      },
      ...$polls
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
      await supabase.from('apps_poll_submission').delete().match({ poll_id: pollId });
      await supabase.from('apps_poll_option').delete().match({ poll_id: pollId });
      await supabase.from('apps_poll').delete().match({ id: pollId });

      $polls = [...$polls.filter((p, i) => p.id !== pollId)];

      $course.appsPollCount = [{ count: $polls.length }];
    };
  }

  onMount(async () => {
    if (!$course.id) return;
    isLoading = true;
    const { data, error } = await fetchPolls($course.id);

    if (!data || error) {
      console.log(error);
      isLoading = false;
      return;
    }

    polls.set(getPollsData(data, $apps.isStudent));
    isLoading = false;
  });

  $: currentGroupMember = $group.people.find((person) => person.profile_id === $profile.id);
  $: author = {
    id: currentGroupMember?.id || '',
    username: $profile.username || '',
    fullname: $profile.fullname || '',
    avatarUrl: $profile.avatar_url || ''
  };

  $: {
    tabs = [
      {
        label: 'Active polls',
        value: 0,
        number: $polls.filter(
          (poll) => new Date(poll.expiration).getMilliseconds() <= new Date().getMilliseconds()
        ).length
      },
      {
        label: 'Expired polls',
        value: 1,
        number: $polls.filter(
          (poll) => new Date(poll.expiration).getMilliseconds() >= new Date().getMilliseconds()
        ).length
      }
    ];
  }
</script>

<PageNav title="Poll" overidableStyle="padding: 0 10px" paddingClass="w-full">
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

      {#if isLoading}
        Loading...
      {:else}
        {#each $polls as poll}
          {#if selectedTab === tabs[0].value}
            <Poll
              bind:poll
              onSelect={handleVote(poll.id, currentGroupMember?.id || '', author)}
              handlePollDelete={handlePollDelete(poll.id)}
              currentUserId={currentGroupMember?.id || ''}
            />
          {:else if selectedTab === tabs[1].value}
            <Poll
              bind:poll
              onSelect={handleVote(poll.id, currentGroupMember?.id || '', author)}
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
      {/if}
    </div>
  {/if}
</div>
