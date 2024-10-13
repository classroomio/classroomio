<script>
  import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
  import { ChevronLeft, Menu, Close } from 'carbon-icons-svelte';
  import { onMount } from 'svelte';

  export let data;
  let open = false;
  let loading = true;

  const { metadata, lessons, slug } = data;

  let selectedLesson = lessons[0];
  let lessonContent = '';

  const formatIndex = (number) => {
    if (number > 9) {
      return number;
    } else {
      return `0${number}`;
    }
  };

  async function getLessonContent(lesson) {
    const { filename } = lesson;
    loading = true;
    try {
      const response = await fetch(`/api/lesson/${slug}/${filename}`);
      const text = await response.text();
      lessonContent = text;
      selectedLesson = lesson;
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    getLessonContent(selectedLesson);
  });
</script>

<section class="relative">
  <!-- Nav -->
  <div class="px-4 w-full h-10 flex items-center gap-3 bg-blue-700 text-white">
    <button on:click={() => (open = !open)} class="md:hidden">
      {#if open}
        <Close size={20} />
      {:else}
        <Menu size={20} />
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
        ? 'translate-x-0'
        : '-translate-x-full md:translate-x-0'}"
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
              getLessonContent(lesson);
              open = !open;
            }}
            class="flex items-center gap-2 mb-4 rounded-md hover:bg-[#EAEAEA] p-2 cursor-pointer text-[#656565] {selectedLesson.filename ===
            lesson.filename
              ? 'font-semibold bg-[#EAEAEA]'
              : ''}"
          >
            <div
              class="flex items-center justify-center bg-[#D9E0F5] text-[#0233BD] text-xs font-semibold rounded-full w-6 h-6"
            >
              {formatIndex(index + 1)}
            </div>

            <p class="truncate capitalize">{lesson.title}</p>
          </div>
        {/each}
      </div>
    </div>
    <div class="w-full p-3">
      {#if loading}
        <div class="space-y-8 w-full md:w-[80%]">
          <Skeleton class="h-12 w-[70%]" />
          <div class="space-y-2">
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-full" />
          </div>
        </div>
      {:else}
        <p class="font-semibold text-2xl mb-4 capitalize">{selectedLesson.title}</p>
        <div>{@html lessonContent}</div>
      {/if}
    </div>
  </div>
</section>
