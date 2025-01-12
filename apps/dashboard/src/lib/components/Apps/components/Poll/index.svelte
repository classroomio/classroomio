<script lang="ts">
  import CloseButton from '$lib/components/Buttons/Close/index.svelte';
  import { course, group } from '$lib/components/Course/store';
  import { PageNav } from '$lib/components/Page';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';
  import { globalStore } from '$lib/utils/store/app';
  import { profile } from '$lib/utils/store/user';
  import type { Groupmember } from '$lib/utils/types';
  import type {
    PostgrestSingleResponse,
    RealtimeChannel,
    RealtimePostgresChangesPayload
  } from '@supabase/supabase-js';
  import { onDestroy, onMount } from 'svelte';
  import CreatePollForm from './components/CreatePollForm.svelte';
  import Poll from './components/Poll.svelte';
  import Tabs from './components/Tabs.svelte';
  import { fetchPolls, handleVote } from './service';
  import { polls } from './store';
  import type { PollOptionsSubmissionType, PollType, TabsType } from './types';
  import { getPollsData } from './utils';

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
  let pollSubmissionsChannel: RealtimeChannel;

  let tabs: TabsType = [];
  let activePolls: PollType[] = [];
  let expiredPolls: PollType[] = [];

  function setCoursePolls() {
    $course.polls = $polls.map((p) => ({ status: p.status }));
  }

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
      snackbar.error('snackbar.poll.error.creating_poll');
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
      snackbar.error('snackbar.poll.error.creating_poll');
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

    setCoursePolls();
  }

  async function handleInsert(payload: RealtimePostgresChangesPayload<PollOptionsSubmissionType>) {
    const newVote = payload.new as PollOptionsSubmissionType;

    const {
      data,
      error
    }: PostgrestSingleResponse<{
      profile: {
        username: string;
        fullname: string;
        avatar_url: string;
      };
    }> = await supabase
      .from('groupmember')
      .select('profile:profile_id(username, fullname, avatar_url)')
      .eq('id', newVote.selected_by_id)
      .single();

    console.log('newVote => data', data);
    console.log('newVote => error', error);

    if (error || !data) {
      return;
    }

    $polls = $polls.map((poll) => {
      if (poll.id === newVote.poll_id) {
        return {
          ...poll,
          options: poll.options.map((option) => {
            if (option.id === newVote.poll_option_id) {
              if (option.selectedBy.some((s) => s.id === newVote.selected_by_id)) {
                return option;
              }

              return {
                ...option,
                selectedBy: [
                  ...option.selectedBy,
                  {
                    id: newVote.selected_by_id,
                    username: data.profile.username,
                    fullname: data.profile.fullname,
                    avatarUrl: data.profile.avatar_url
                  }
                ]
              };
            }

            return option;
          })
        };
      }

      return poll;
    });
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

      setCoursePolls();
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

    polls.set(getPollsData(data, $globalStore.isStudent));

    setCoursePolls();

    isLoading = false;

    pollSubmissionsChannel = supabase
      .channel('any')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'apps_poll_submission' },
        handleInsert
      )
      .subscribe();
  });

  onDestroy(() => {
    supabase.removeChannel(pollSubmissionsChannel);
  });

  $: currentGroupMember = $group.people.find(
    (person) => person.profile_id === $profile.id
  ) as Groupmember;

  $: author = {
    id: currentGroupMember?.id || '',
    username: $profile.username || '',
    fullname: $profile.fullname || '',
    avatarUrl: $profile.avatar_url || ''
  };

  $: {
    activePolls = $polls.filter(
      (poll) => new Date(poll.expiration).getTime() >= new Date().getTime()
    );
    expiredPolls = $polls.filter(
      (poll) => new Date(poll.expiration).getTime() <= new Date().getTime()
    );
    tabs = [
      {
        label: $t('course.navItem.lessons.polls.active_polls'),
        value: 0,
        number: activePolls.length
      },
      {
        label: $t('course.navItem.lessons.polls.expired_polls'),
        value: 1,
        number: expiredPolls.length
      }
    ];
  }
</script>

<PageNav
  title={$t('course.navItem.lessons.polls.title')}
  overidableStyle="padding: 0 10px"
  paddingClass="w-full"
>
  <div slot="widget">
    <CloseButton onClick={handleClose} />
  </div>
</PageNav>

<div class="overlow-y-auto w-full p-2 md:min-w-[340px] md:max-w-[350px]">
  {#if openCreatePollForm}
    <CreatePollForm
      onSubmit={handlePollCreate}
      onCancel={() => (openCreatePollForm = !openCreatePollForm)}
      bind:isSaving={isCreating}
    />
  {:else if currentGroupMember}
    <div>
      <Tabs {tabs} bind:selectedTab onCreate={() => (openCreatePollForm = !openCreatePollForm)} />

      {#if isLoading}
        {$t('course.navItem.lessons.polls.loading')}...
      {:else}
        {#each selectedTab === tabs[0].value ? activePolls : expiredPolls as poll}
          <Poll
            bind:poll
            onSelect={handleVote(poll.id, currentGroupMember?.id || '', author)}
            handlePollDelete={handlePollDelete(poll.id)}
            bind:currentUserId={currentGroupMember.id}
          />
        {:else}
          <div
            class="bg-gray-100 dark:bg-neutral-800 border rounded-md h-60 flex items-center justify-center"
          >
            <h2 class="text-xl font-bold">{$t('course.navItem.lessons.polls.no_polls')}</h2>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>
