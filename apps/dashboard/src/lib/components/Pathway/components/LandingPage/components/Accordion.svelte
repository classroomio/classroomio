<script lang="ts">
  import type { PathwayCourse } from '$lib/utils/types';
  import { ChevronDown, ChevronUp } from 'carbon-icons-svelte';

  type Section = PathwayCourse & {
    expanded?: boolean;
  };

  export let sections: Section[] = [];

  const toggleSection = (index: number) => {
    sections = sections.map((section, i) => ({
      ...section,
      expanded: i === index ? !section.expanded : false // Collapse others
    }));
  };
</script>

<div class="mt-10 w-full rounded-xl border p-4">
  {#each sections as section, index}
    <div class="mb-2 border-b border-gray-300 last:border-b-0 dark:border-neutral-600">
      <button
        class="flex w-full cursor-pointer items-center justify-between rounded-t-md px-5 py-4 dark:bg-neutral-800"
        on:click={() => toggleSection(index)}
      >
        <div class="text-left">
          <h3 class="m-0 text-lg font-semibold">{section.course.title}</h3>
          <p class="text-sm text-gray-600">{section.course.lesson?.length} Lessons</p>
        </div>
        <button class="text-blue-500">
          {#if section.expanded}
            <ChevronDown />
          {:else}
            <ChevronUp />
          {/if}
        </button>
      </button>
      {#if section.expanded}
        <div class="p-4">
          <p class="text-left text-sm">{section.course.description}</p>
        </div>
      {/if}
    </div>
  {/each}
</div>
