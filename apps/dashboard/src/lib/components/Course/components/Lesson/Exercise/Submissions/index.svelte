<script lang="ts">
  import { fetchSubmission } from '$lib/utils/services/submissions';
  import { browser } from '$app/environment';
  import Summary from './Summary.svelte';
  import Individual from './Individual.svelte';
  import { submissions } from './store';
  import { t } from '$lib/utils/functions/translations';

  export let exerciseId: string;

  const tabs = [
    {
      label: $t('course.navItem.lessons.exercise.all_exercises.analytics.summary.heading'),
      value: 'summary'
    },
    {
      label: $t('course.navItem.lessons.exercise.all_exercises.analytics.individual.heading'),
      value: 'individual'
    }
  ];
  let currentTab = tabs[0].value;

  let isLoading = true;

  const onChange = (tabValue: string) => () => (currentTab = tabValue);

  async function fetchSubmissions(id: string | undefined) {
    if (!id) return;
    isLoading = true;

    const { data } = await fetchSubmission({
      exerciseId: id
    });

    if (!data) return;

    submissions.set(data);

    isLoading = false;
  }

  $: browser && fetchSubmissions(exerciseId);
</script>

<div class="w-full flex flex-col">
  <div class="border rounded-md mb-2 px-4">
    <div class="mt-4">
      <p class="text-lg">
        {$submissions.length}
        {$t('course.navItem.lessons.exercise.all_exercises.analytics.submissions')}
      </p>
    </div>
    <div class="flex items-center justify-center overflow-x-auto">
      {#each tabs as tab}
        <button
          class="relative {currentTab === tab.value
            ? 'text-primary-700'
            : 'dark:bg-gray-500 dark:text-white'} dark:bg-transparent font-semibold focus:outline-none w-fit mr-4 text-center py-3 px-2"
          on:click={onChange(tab.value)}
        >
          <div class="flex items-center justify-center w-full text-center">
            {tab.label}
          </div>
          <span
            class="absolute bottom-0 left-0 h-[2px] bg-primary-700 transition-all ease-in-out duration-500 {currentTab ===
            tab.value
              ? 'w-full'
              : 'w-0'}"
          />
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
