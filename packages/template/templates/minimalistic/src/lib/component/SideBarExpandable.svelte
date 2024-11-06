<script lang="ts">
  import type { Lesson } from '$lib/utils/types';
  import { ChevronDown, ChevronUp } from 'carbon-icons-svelte';

  export let item;
  export let toggleSideBar: () => void;
  export let getLessonContent: (lesson: Lesson, section: string) => void;
  export let activeLesson = '';
  const { title, section_slug, children, published } = item;

  let isLessonOpen = getIsActive(children) ? true : false;

  function getIsActive(children: Lesson[]) {
    if (published) {
      return children.some((lesson) => lesson.title == activeLesson);
    }
  }
  const toggleLesson = () => {
    if (published) isLessonOpen = !isLessonOpen;
  };
</script>

<button
  on:click={() => toggleLesson()}
  class="border-none flex flex-row items-center justify-between w-full"
>
  <div>
    <p class="text-[13px] capitalize text-start">
      {title}
    </p>
  </div>
  <div class="flex items-center gap-2">
    {#if published}
      <div class="w-[6px] h-[6px] rounded-full bg-gray-300" />
    {:else}
      <div class="bg-gray-300 text-black text-[9px] p-[2px] uppercase font-medium">coming soon</div>
    {/if}
    {#if isLessonOpen}
      <ChevronUp />
    {:else}
      <ChevronDown />
    {/if}
  </div>
</button>
{#if isLessonOpen}
  <div class="transition">
    {#each children as lesson}
      <div
        class="pl-4 py-3 w-full border-l hover:border-black hover:dark:border-white cursor-pointer {lesson.title ===
        activeLesson
          ? ' border-black dark:border-white'
          : 'border-gray-400 dark:border-gray-700'}"
        on:click={() => {
          getLessonContent(lesson, section_slug);
          toggleSideBar();
        }}
      >
        <div>
          <p class="text-gray-500 hover:text-black hover:dark:text-white text-[13px] capitalize">
            {lesson.title}
          </p>
        </div>
      </div>
    {/each}
  </div>
{/if}
