<script lang="ts">
  import { CheckmarkOutline, ChevronDown, ChevronUp } from 'carbon-icons-svelte';
  import pluralize from 'pluralize';

  import { t } from '$lib/utils/functions/translations';
  import type { Lesson } from '$lib/utils/types';

  export let title: string;
  export let lessonCount: number;
  export let exerciseCount: number;
  export let lessons: Lesson[];

  let expand = false;
</script>

<div class="w-full rounded-md my-3">
  <!-- lesson header -->
  <button
    class="py-3 pl-3 pr-4 bg-[#F7F7F7] dark:bg-neutral-700 text-sm font-medium flex items-center justify-between w-full"
    on:click={() => (expand = !expand)}
  >
    <span class="flex items-center gap-2">
      {#if expand}
        <ChevronUp />
      {:else}
        <ChevronDown />
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
      <div class="py-3 pl-3 text-[13px] text-[#656565] flex items-center gap-2 lesson-section">
        <CheckmarkOutline size={16} class="scale-[0.8]" />
        {lesson.title}
      </div>
    {/each}
  {/if}
</div>
