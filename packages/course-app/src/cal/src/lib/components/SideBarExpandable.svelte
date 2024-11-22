<script lang="ts">
  import type { Lesson, Section } from '$lib/utils/types/course';
  import { ChevronDown, ChevronUp } from 'carbon-icons-svelte';

  interface Props {
    section: Section;
    courseSlug: string;
    toggleSideBar: () => void;
    activeLesson?: string;
  }

  let { section, courseSlug, activeLesson = '' }: Props = $props();
  const { title, sectionSlug, children, published } = section;

  let isExpanded = $state(getIsActive(children) ? true : false);

  function getIsActive(children: Lesson[]) {
    if (published) {
      return children.some((lesson) => lesson.title == activeLesson);
    }
  }
  const toggleSection = () => {
    if (published) isExpanded = !isExpanded;
  };
</script>

<button
  onclick={toggleSection}
  class="border-none flex flex-row items-center justify-between w-full"
>
  <div>
    <p class="text-[13px] capitalize text-start">
      {title}
    </p>
  </div>
  <div class="flex items-center gap-2">
    {#if published}
      <div class="w-[6px] h-[6px] rounded-full bg-gray-300"></div>
    {:else}
      <div class="bg-gray-300 text-black text-[9px] p-[2px] uppercase font-medium">coming soon</div>
    {/if}
    {#if isExpanded}
      <ChevronUp />
    {:else}
      <ChevronDown />
    {/if}
  </div>
</button>

{#if isExpanded}
  <div class="transition">
    {#each children as lesson}
      <a
        class="pl-4 py-3 w-full border-l hover:border-black hover:dark:border-white cursor-pointer {lesson.title ===
        activeLesson
          ? ' border-black dark:border-white'
          : 'border-gray-400 dark:border-gray-700'}"
        href={`/course/${courseSlug}/${sectionSlug}/${lesson.filename}`}
      >
        <div>
          <p class="text-gray-500 hover:text-black hover:dark:text-white text-[13px] capitalize">
            {lesson.title}
          </p>
        </div>
      </a>
    {/each}
  </div>
{/if}
