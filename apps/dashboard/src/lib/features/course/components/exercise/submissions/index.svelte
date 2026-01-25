<script lang="ts">
  import { untrack } from 'svelte';
  import { submissionApi } from '$features/course/api';
  import { courseApi } from '$features/course/api';
  import Summary from './summary.svelte';
  import Individual from './individual.svelte';
  import { submissions } from './store';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    exerciseId: string;
  }

  let { exerciseId = $bindable('') }: Props = $props();

  const tabs = [
    {
      label: $t('course.navItem.lessons.exercises.all_exercises.analytics.summary.heading'),
      value: 'summary'
    },
    {
      label: $t('course.navItem.lessons.exercises.all_exercises.analytics.individual.heading'),
      value: 'individual'
    }
  ];
  let currentTab = $state(tabs[0].value);

  let isLoading = $state(true);

  const onChange = (tabValue: string) => () => (currentTab = tabValue);

  async function fetchSubmissions(id: string | undefined) {
    if (!id || !courseApi.course?.id) return;
    isLoading = true;

    await submissionApi.list(courseApi.course?.id, id);

    // Transform API data to ExerciseSubmissions format
    if (submissionApi.data && Array.isArray(submissionApi.data)) {
      const transformedSubmissions = submissionApi.data.map((submission: any) => ({
        id: submission.id,
        status_id: submission.statusId || submission.status_id || 1,
        submitted_by: {
          profile: submission.groupmember?.profile || {
            id: '',
            fullname: '',
            avatar_url: ''
          }
        },
        answers: (submission.answers || []).map((answer: any) => ({
          id: answer.id,
          question_id: answer.questionId || answer.question_id,
          open_answer: answer.openAnswer || answer.open_answer || '',
          answers: answer.answers || [],
          point: answer.point || 0,
          submission_id: answer.submissionId || answer.submission_id || submission.id,
          group_member_id: answer.groupMemberId || answer.group_member_id || ''
        }))
      }));

      submissions.set(transformedSubmissions);
    }

    isLoading = false;
  }

  $effect(() => {
    untrack(() => {
      fetchSubmissions(exerciseId);
    });
  });
</script>

<div class="flex w-full flex-col">
  <div class="mb-2 rounded-md border px-4">
    <div class="mt-4">
      <p class="text-lg">
        {$submissions.length}
        {$t('course.navItem.lessons.exercises.all_exercises.analytics.submissions')}
      </p>
    </div>
    <div class="flex items-center justify-center overflow-x-auto">
      {#each tabs as tab}
        <button
          class="relative {currentTab === tab.value
            ? 'ui:text-primary'
            : 'dark:bg-gray-500 dark:text-white'} mr-4 w-fit px-2 py-3 text-center font-semibold focus:outline-none dark:bg-transparent"
          onclick={onChange(tab.value)}
        >
          <div class="flex w-full items-center justify-center text-center">
            {tab.label}
          </div>
          <span
            class="bg-primary-700 absolute bottom-0 left-0 h-[2px] transition-all duration-500 ease-in-out {currentTab ===
            tab.value
              ? 'w-full'
              : 'w-0'}"
          ></span>
        </button>
      {/each}
    </div>
  </div>
  {#if currentTab === tabs[0].value}
    <Summary bind:isLoading />
  {:else}
    <Individual bind:isLoading />
  {/if}
</div>
