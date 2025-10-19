<script lang="ts">
  import { untrack } from 'svelte';
  import { fetchSubmission } from '$lib/utils/services/submissions';
  import Summary from './Summary.svelte';
  import Individual from './Individual.svelte';
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

  function fetchSubmissions(id: string | undefined) {
    untrack(async () => {
      if (!id) return;
      isLoading = true;

      const { data } = await fetchSubmission({
        exerciseId: id
      });

      if (!data) return;

      submissions.set(data);

      isLoading = false;
    });
  }

  $effect(() => {
    fetchSubmissions(exerciseId);
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
            ? 'text-primary-700'
            : 'dark:bg-gray-500 dark:text-white'} mr-4 w-fit px-2 py-3 text-center font-semibold focus:outline-hidden dark:bg-transparent"
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
