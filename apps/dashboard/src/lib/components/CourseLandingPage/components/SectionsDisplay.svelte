<script lang="ts">
  import { CheckmarkOutline, ChevronDown, ChevronUp } from 'carbon-icons-svelte';

  import { t } from '$lib/utils/functions/translations';
  import type { Lesson } from '$lib/utils/types';
  import IconButton from '$lib/components/IconButton/index.svelte';

  export let index: number;
  export let title: string;
  export let lessonCount: number;
  export let exerciseCount: number;
  export let lessons: Lesson;
  export let showLessons: boolean[] = Array(lessons.length).fill(true);

  function toggleShowLessons(index) {
    showLessons[index] = !showLessons[index];
  }
</script>

<div class="w-full rounded-md my-3">
  <!-- lesson header -->
  <div class="py-1 pl-3 pr-4 bg-[#F7F7F7] text-sm font-medium flex items-center justify-between">
    <span class="flex items-center gap-2">
      <IconButton onClick={() => toggleShowLessons(index)}>
        {#if showLessons[index]}
          <ChevronDown />
        {:else}
          <ChevronUp />
        {/if}
      </IconButton>
      {title}</span
    >
    <span class="text-xs font-normal"
      >{lessonCount}
      {$t('course.navItem.landing_page.lessons')}, {exerciseCount}
      {$t('course.navItem.landing_page.exercises')}</span
    >
  </div>

  <!-- lessons -->
  {#if showLessons[index]}
    {#each lessons as lesson}
      <div class="py-3 pl-6 text-[13px] text-[#656565] flex items-center gap-5 lesson-section">
        <CheckmarkOutline size={16} class="scale-[0.8]" />
        {lesson.title}
      </div>
    {/each}
  {/if}
</div>
