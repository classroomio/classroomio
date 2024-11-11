<script lang="ts">
  import { browser } from '$app/environment';
  import { isDark } from '$lib/component/store.js';
  import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
  import { toggleBodyByMode } from '$lib/utils/toggleMode';
  import { ChevronLeft, Menu, Close } from 'carbon-icons-svelte';
  import { onMount } from 'svelte';
  import Light from 'carbon-icons-svelte/lib/Light.svelte';
  import Moon from 'carbon-icons-svelte/lib/Moon.svelte';
  import SideBarExpandable from '$lib/component/SideBarExpandable.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import type { Lesson } from '$lib/utils/types';

  interface Props {
    data: any;
  }

  let { data }: Props = $props();

  console.log('new data', data);
  let open = $state(false);
  let loading = $state(true);
  let initialLoad = $state(false);

  const { metadata, sections, slug } = data;

  let activeLesson: Lesson | undefined = $state();

  let lessonContent: string | undefined = $state();

  async function getLessonContent(lesson: Lesson, section: string) {
    loading = true;
    const { filename } = lesson;
    try {
      const response = await fetch(`/api/lesson/${slug}/${section}/${filename}`);
      const { content } = await response.json();
      lessonContent = content;
      activeLesson = lesson;
    } catch (error) {
      console.log('Error loading lesson:', error);
    } finally {
      loading = false;
      initialLoad = true;
    }
  }

  const toggleSideBar = () => {
    open = !open;
  };
  function toggleDarkMode() {
    $isDark = !$isDark;
    toggleBodyByMode($isDark);
    if (browser) {
      localStorage.setItem('mode', $isDark ? 'dark' : '');
    }
  }

  onMount(() => {
    if (browser) {
      const mode = localStorage.getItem('mode');
      $isDark = mode == '' ? false : true;
      toggleBodyByMode($isDark);
    }

    let selectedSection;
    for (let section of sections) {
      if (section.published) {
        selectedSection = section;
        break;
      }
    }

    if (selectedSection) {
      activeLesson = selectedSection.children[0];
      getLessonContent(selectedSection.children[0], selectedSection.section_slug);
      console.log('active lesson', activeLesson);
    }
  });
</script>

<section class="relative overflow-hidden h-screen">
  <div
    class="sticky top-0 px-4 w-full h-14 flex items-center justify-between border-b bg-[#F7F7F7] dark:bg-inherit"
  >
    <div class="lg:pl-4 flex items-center gap-3">
      <button onclick={toggleSideBar} class="md:hidden">
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
      <button onclick={toggleDarkMode}>
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

  <div class="overflow-hidden flex">
    <!-- sidebar -->
    <div
      class="fixed md:relative transition-all bg-[#F7F7F7] dark:bg-[#03030a] w-[300px] md:w-[380px] h-[calc(100vh-56px)] overflow-y-scroll scrollbar-hide p-4 pl-6 space-y-4 {open
        ? 'translate-x-0'
        : '-translate-x-full md:translate-x-0 z-50'}"
    >
      <a
        href="/courses"
        class="text-[13px] flex items-center text-[#0A0D14] dark:text-white cursor-pointer h-[26px]"
      >
        <ChevronLeft />
        <p>Back to course page</p>
      </a>
      {#if !initialLoad}
        <div class="space-y-10 w-full">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-full" />
        </div>
      {:else}
        <div class="space-y-6">
          {#each sections as sidebar}
            <SideBarExpandable
              item={sidebar}
              {getLessonContent}
              activeLesson={activeLesson?.title}
              {toggleSideBar}
            />
          {/each}
        </div>
      {/if}
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
        <p class="font-semibold text-2xl mb-4 capitalize">{activeLesson?.title}</p>
        <div class="h-fit pb-14">
          {@html lessonContent}
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  /* Hide scrollbar for Webkit browsers */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for other browsers */
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>
