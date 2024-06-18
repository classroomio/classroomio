<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import CaretRight from 'carbon-icons-svelte/lib/CaretRight.svelte';
  import { fetchLesssonLanguageHistory } from '$lib/utils/services/courses';
  import { diffLines } from 'diff';
  import { lesson, lessons } from '$lib/components/Course/components/Lesson/store/lessons';
  import { supabase } from '$lib/utils/functions/supabase';

  import { LOCALE } from '$lib/utils/types';

  interface LessonHistory {
    new_content: string;
    old_content: string;
    timestamp: Date;
    locale: LOCALE;
    lesson_id: string;
  }

  export let open = false;
  let lessonTitle: string = '';
  let lessonId: string = '';
  let lessonHistory: LessonHistory[] = [];
  let content = '';
  let selectedVersion: LessonHistory = {
    new_content: '',
    old_content: '',
    timestamp: new Date(),
    locale: LOCALE.EN,
    lesson_id: ''
  };
  let selectedVersionIndex = 0;
  let contentRestoreLoading = false;
  let versionsToFetch = 9;
  let isMoreHistoryLoading = false;

  let mounted = false;

  const dispatch = createEventDispatcher();

  function scrollLock(open) {
    if (mounted) {
      const body = document.querySelector('body');
      body.style.overflow = open ? 'hidden' : 'auto';
    }
  }

  function formatTimestamp(timestamp) {
    const options = {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  function handleDrawerClose() {
    dispatch('drawerClose');
  }

  async function fetchLessonHistory(lessonId: string, locale: string, endRange: number) {
    try {
      isMoreHistoryLoading = true;
      const { data, error } = await fetchLesssonLanguageHistory(lessonId, locale, endRange);
      // Filter out duplicates based on timestamp
      const existingTimestamps = new Set(lessonHistory.map((item) => item.timestamp));
      const newEntries = data.filter((item) => !existingTimestamps.has(item.timestamp));
      lessonHistory = [...lessonHistory, ...newEntries];
      updateContentVersion(lessonHistory[0], 0);
    } catch (error) {
      console.error(error);
    } finally {
      isMoreHistoryLoading = false;
    }
  }

  onMount(() => {
    mounted = true;
    scrollLock(open);
  });

  function updateContentVersion(content: LessonHistory, index: number) {
    selectedVersionIndex = index;
    selectedVersion = content;
    const display = document.getElementById('display');
    display!.innerHTML = '';

    const diff = diffLines(content.old_content, content.new_content);
    const fragment = document.createDocumentFragment();

    diff.forEach((part) => {
      const span = document.createElement('span');
      if (part.added) {
        span.classList.add('text-green-500');
      } else if (part.removed) {
        span.classList.add('text-red-500', 'line-through');
      } else {
        span.classList.add('text-black', 'dark:text-white');
      }
      span.innerHTML = part.value;
      fragment.appendChild(span);
    });

    display!.appendChild(fragment);
  }

  async function restoreSelectedVersion() {
    try {
      contentRestoreLoading = true;
      await supabase
        .from('lesson_language')
        .update({ content: selectedVersion.new_content })
        .eq('lesson_id', selectedVersion.lesson_id)
        .eq('locale', selectedVersion.locale);
    } catch (error) {
      console.error(error);
    } finally {
      contentRestoreLoading = false;
      dispatch('drawerClose');
    }
  }

  function loadMoreHistory() {
    versionsToFetch += 10;
  }

  $: lessonTitle = $lessons.find((les) => les.id === $lesson.id)?.title || '';
  $: lessonId = $lesson.id;
  $: scrollLock(open);
  $: fetchLessonHistory(lessonId, $lesson.locale, versionsToFetch);
</script>

<aside class="drawer bg-gray-100 dark:bg-neutral-800" class:open>
  <div class="panel bg-white dark:bg-black">
    <div class="p-10 w-full pr-80">
      <div class="flex items-start gap-x-10">
        <PrimaryButton variant={VARIANTS.OUTLINED} onClick={handleDrawerClose}>
          <ArrowLeft />
        </PrimaryButton>

        {#if selectedVersionIndex != 0}
          <div class="">
            <PrimaryButton isLoading={contentRestoreLoading} onClick={restoreSelectedVersion}
              >Restore this Version</PrimaryButton
            >
          </div>
        {/if}
      </div>
      <div class="w-full h-full flex flex-col items-start">
        <HtmlRender className="m-auto text-center mt-6 flex items-center justify-center">
          <svelte:fragment slot="content">
            <h1 class="text-2xl md:text-4xl mt-0 capitalize">
              {lessonTitle}
            </h1>
          </svelte:fragment>
        </HtmlRender>

        {#key lessonId}
          <HtmlRender id="display" className="m-auto">
            <svelte:fragment slot="content">
              <div class="amen">
                {@html content}
              </div>
            </svelte:fragment>
          </HtmlRender>
        {/key}
      </div>
    </div>
  </div>
  <div
    id="scroll-container"
    class="w-80 fixed right-0 top-0 min-h-screen h-full z-10 overflow-x-auto overflow-y-scroll bg-gray-100 dark:bg-neutral-800 py-10 space-y-6"
  >
    <p class="font-medium text-xl text-left flex items-start justify-start px-10">
      Version History
    </p>

    <div>
      {#each lessonHistory as version, index}
        <button
          on:click={() => updateContentVersion(version, index)}
          class="hover:bg-gray-200 dark:hover:bg-neutral-700 cursor-pointer p-4 w-full px-10 flex items-start {index ==
          selectedVersionIndex
            ? 'bg-gray-200 dark:bg-neutral-700'
            : ''}"
        >
          <CaretRight class="mt-1"></CaretRight>
          <div>
            <span class="inline-block font-medium text-base"
              >{formatTimestamp(version.timestamp)}</span
            >
            {#if index == 0}
              <span class="block italic text-xs text-start">Current Version</span>
            {/if}
          </div>
        </button>
      {/each}
      <div class="flex items-center justify-start px-10 mt-2 h-10">
        <PrimaryButton className="h-full" isLoading={isMoreHistoryLoading} onClick={loadMoreHistory}
          >Fetch more versions</PrimaryButton
        >
      </div>
    </div>
  </div>
</aside>

<style>
  .drawer {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    z-index: -1;
  }

  .drawer.open {
    z-index: 99;
  }

  .panel {
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 3;
    overflow: auto;
  }

  .drawer.open .panel {
    transform: translate(0, 0);
  }
</style>
