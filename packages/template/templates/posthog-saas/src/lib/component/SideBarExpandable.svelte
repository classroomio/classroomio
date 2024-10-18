<script>
  import { ChevronDown, ChevronUp } from 'carbon-icons-svelte';

  export let item;
  const { title, children, published } = item;

  let isLessonOpen = false;

  const toggleLesson = () => {
    if (published) isLessonOpen = !isLessonOpen;
  };
</script>

<button
  on:click={() => toggleLesson()}
  class="border-none flex flex-row items-center justify-between w-full"
>
  <div>
    <p>
      {title}
    </p>
  </div>
  <div class="flex items-center gap-2">
    {#if published}
      <div class="w-[6px] h-[6px] rounded-full bg-gray-400" />
    {:else}
      <div class="bg-gray-400 text-black text-[9px] uppercase font-semibold">coming soon</div>
    {/if}
    {#if isLessonOpen}
      <ChevronUp />
    {:else}
      <ChevronDown />
    {/if}
  </div>
</button>
{#if isLessonOpen}
  <div>
    {#each children as lesson}
      <div
        class="pl-4 py-3 w-full border-l border-gray-400 dark:border-gray-700 hover:border-black hover:dark:border-white cursor-pointer"
      >
        <div>
          <p class="text-gray-500 hover:text-black hover:dark:text-white font-extralight">
            {lesson}
          </p>
        </div>
      </div>
    {/each}
  </div>
{/if}
