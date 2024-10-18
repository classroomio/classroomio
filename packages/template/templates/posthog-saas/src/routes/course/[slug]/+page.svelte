<script>
  import { browser } from '$app/environment';
  import { isDark } from '$lib/component/store.js';
  import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
  import { toggleBodyByMode } from '$lib/utils/toggleMode.js';
  import { ChevronLeft, ChevronUp, ChevronDown, Menu, Close } from 'carbon-icons-svelte';
  import { onMount } from 'svelte';
  import Light from 'carbon-icons-svelte/lib/Light.svelte';
  import Moon from 'carbon-icons-svelte/lib/Moon.svelte';
  import SideBarExpandable from '$lib/component/SideBarExpandable.svelte';
  import Button from '$lib/components/ui/button/button.svelte';

  export let data;
  let open = false;
  let loading = true;
  let isLessonOpen = false;
  const mockSidebar = [
    {
      title: 'Introduction',
      published: true,
      children: ['Introduction to the course', 'Overview', 'What is progress']
    },
    {
      title: 'Fundamental of postgres',
      published: true,
      children: ['Introduction to the course', 'Overview', 'What is postgress']
    },
    {
      title: 'Introduction',
      published: true,
      children: ['Introduction to the course', 'Overview', 'What is progress']
    },
    {
      title: 'Conclusion',
      published: false,
      children: ['Introduction to the course', 'Overview', 'What is progress']
    },
    {
      title: 'Conclusion',
      published: false,
      children: ['Introduction to the course', 'Overview', 'What is progress']
    },
    {
      title: 'Conclusion',
      published: true,
      children: ['Introduction to the course', 'Overview', 'What is progress']
    }
  ];

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

  function toggleDarkMode() {
    $isDark = !$isDark;
    toggleBodyByMode($isDark);
    if (browser) {
      localStorage.setItem('mode', $isDark ? 'dark' : '');
    }
  }

  const toggleLesson = () => {
    isLessonOpen = !isLessonOpen;
    console.log('toggle');
  };

  onMount(() => {
    getLessonContent(selectedLesson);
  });
</script>

<section class="relative font-roboto overflow-hidden h-screen">
  <!-- Nav -->
  <div class="sticky top-0 px-4 w-full h-14 flex items-center justify-between border-b">
    <div class="lg:pl-4 flex items-center gap-3">
      <button on:click={() => (open = !open)} class="md:hidden">
        {#if open}
          <Close size={20} />
        {:else}
          <Menu size={20} />
        {/if}
      </button>
      <p class="text-start line-clamp-1 font-semibold text-lg capitalize" title={metadata.title}>
        {metadata.title}
      </p>
    </div>
    <div class="flex flex-row items-center gap-1">
      <button on:click={toggleDarkMode}>
        {#if $isDark}
          <Light size={16} />
        {:else}
          <Moon size={16} />
        {/if}
      </button>
      <Button class="capitalize py-2 w-14 h-fit bg-gray-900 text-white hover:bg-black">login</Button
      >
      <Button class="capitalize py-2 w-16 h-fit bg-green-500 text-white hover:bg-green-500"
        >Buy now</Button
      >
    </div>
  </div>
  <!-- body -->
  <div class="overflow-hidden flex">
    <!-- sidebar -->
    <div
      class="fixed md:relative transition-all bg-[#F7F7F7] dark:bg-[#03030a] w-[300px] md:w-[380px] h-[calc(100vh-56px)] overflow-y-scroll p-4 pl-6 space-y-4 {open
        ? 'translate-x-0 '
        : '-translate-x-full md:translate-x-0 z-50'}"
    >
      <a
        href="/courses"
        class="flex items-center text-[#0A0D14] dark:text-white cursor-pointer h-[26px]"
      >
        <ChevronLeft />
        <p>Back to course page</p>
      </a>

      <div class="space-y-6">
        {#each mockSidebar as sidebar}
          <SideBarExpandable item={sidebar} />
        {/each}
      </div>

      <!-- <div class="space-y-8">
        {#each lessons as lesson, index}
          <div
            on:click={() => {
              getLessonContent(lesson);
              open = !open;
            }}
            class="flex items-center gap-2 mb-4 border-l hover:dark:border-gray-200 hover:border-black px-2 cursor-pointer {selectedLesson.filename ===
            lesson.filename
              ? 'border-l border-black dark:border-gray-200'
              : 'border-transparent'}"
          >
            <div
              class="flex items-center justify-center bg-[#D9E0F5] text-[#0233BD] text-xs font-semibold rounded-full w-6 h-6"
            >
              {formatIndex(index + 1)}
            </div>

            <p class="truncate capitalize text-sm font-light">{lesson.title}</p>
          </div>
        {/each}
      </div> -->
    </div>
    <div class="w-full p-5 md:p-10 break-words h-screen overflow-y-scroll">
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
        <div>
          {@html lessonContent}
        </div>
      {/if}
    </div>
  </div>
</section>
