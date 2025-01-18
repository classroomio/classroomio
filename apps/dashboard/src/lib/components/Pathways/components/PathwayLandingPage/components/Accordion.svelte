<script lang="ts">
  import { ChevronDown, ChevronUp } from 'carbon-icons-svelte';
  export let sections: Array<{ title: string; lessons: string; expanded?: boolean }> = [];

  const toggleSection = (index: number) => {
    sections = sections.map((section, i) => ({
      ...section,
      expanded: i === index ? !section.expanded : false // Collapse others
    }));
  };
</script>

<div class="mt-10 w-full rounded-xl border p-4">
  {#each sections as section, index}
    <div class="border-b border-gray-300 last:border-b-0">
      <div
        class="flex cursor-pointer items-center justify-between rounded-t-md px-5 py-4 hover:bg-gray-50"
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
      </div>
      {#if section.expanded}
        <div class="p-4">
          <p class="text-left text-sm">{section.course.description}</p>
        </div>
      {/if}
    </div>
  {/each}
</div>
