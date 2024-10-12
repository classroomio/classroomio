<script>
  import { goto } from '$app/navigation';
  import { ChevronLeft, Menu, Close } from 'carbon-icons-svelte';
  import { onMount } from 'svelte';

  export let data;
  let open = false;

  const { metadata, lessons, dataSlug } = data;

  let selectedLesson = lessons[0].filename;
  let lessonContent = '';

  const formatIndex = (number) => {
    if (number > 9) {
      return number;
    } else {
      return `0${number}`;
    }
  };

  async function loadLessonContent(filename) {
    try {
      const response = await fetch(`/api/lesson/${dataSlug}/${filename}`);
      const text = await response.text();
      lessonContent = text; // You can directly render this as HTML or markdown.
      selectedLesson = filename;
    } catch (error) {
      console.error('Error loading lesson:', error);
    }
  }
  // Fetch the first lesson content when the component mounts
  onMount(() => {
    loadLessonContent(lessons[0].filename);
  });
  $: console.log('array', lessons, metadata);
</script>

<section class="relative">
  <!-- Nav -->
  <div class="px-4 w-full h-10 flex items-center gap-3 bg-blue-700 text-white">
    <button on:click={() => (open = !open)} class="md:hidden">
      {#if open}
        <Menu size={20} />
      {:else}
        <Close size={20} />
      {/if}
    </button>
    <p class="text-start line-clamp-1 font-semibold text-lg capitalize">
      {metadata.title}
    </p>
  </div>
  <!-- body -->
  <div class="overflow-hidden flex">
    <!-- sidebar -->
    <div
      class="absolute md:relative transition-all bg-[#F7F7F7] w-[300px] md:w-[380px] h-[calc(100vh-40px)] overflow-y-scroll p-4 space-y-4 {open
        ? '-translate-x-full md:translate-x-0'
        : 'translate-x-0'}"
    >
      <a href="/courses" class="flex items-center text-[#0A0D14] cursor-pointer h-[26px]">
        <ChevronLeft />
        <p>Back to course page</p>
      </a>
      <p class="font-semibold text-2xl">Contents</p>

      <div class="space-y-4">
        {#each lessons as lesson, index}
          <div
            on:click={() => {
              loadLessonContent(lesson.filename);
              open = !open;
            }}
            class="flex items-center gap-2 mb-4 rounded-md hover:bg-[#EAEAEA] p-2 cursor-pointer text-[#656565] {selectedLesson ===
            lesson.filename
              ? 'font-semibold bg-[#EAEAEA]'
              : ''}"
          >
            <div
              class="flex items-center justify-center bg-[#D9E0F5] text-[#0233BD] text-xs font-semibold rounded-full w-6 h-6"
            >
              {formatIndex(index + 1)}
            </div>

            <p class="truncate">{lesson.title}</p>
          </div>
        {/each}
      </div>
    </div>
    <div class="w-full p-3">
      <!-- <svelte:component this={lessonContent} /> -->
      <p>{@html lessonContent}</p>
    </div>
  </div>
</section>
