<script lang="ts">
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import pluralize from 'pluralize';

  import { t } from '$lib/utils/functions/translations';
  import type { Lesson } from '$lib/utils/types';

  interface Props {
    title: string;
    lessonCount: number;
    exerciseCount: number;
    lessons: Lesson[];
  }

  let { title, lessonCount, exerciseCount, lessons }: Props = $props();

  let expand = $state(false);
</script>

<div class="my-3 w-full rounded-md">
  <!-- lesson header -->
  <button
    class="flex w-full items-center justify-between bg-[#F7F7F7] py-3 pl-3 pr-4 text-sm font-medium dark:bg-neutral-700"
    onclick={() => (expand = !expand)}
  >
    <span class="flex items-center gap-2">
      {#if expand}
        <ChevronUpIcon />
      {:else}
        <ChevronDownIcon />
      {/if}
      {title}
    </span>
    <span class="text-xs font-normal">
      {pluralize($t('course.navItem.landing_page.lessons'), lessonCount, true)},
      {pluralize($t('course.navItem.landing_page.exercises'), exerciseCount, true)}
    </span>
  </button>

  {#if expand}
    {#each lessons as lesson}
      <div class="lesson-section flex items-center gap-2 py-3 pl-3 text-[13px] text-[#656565]">
        <CircleCheckIcon />
        {lesson.title}
      </div>
    {/each}
  {/if}
</div>
