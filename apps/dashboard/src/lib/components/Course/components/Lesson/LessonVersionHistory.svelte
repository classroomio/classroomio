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
  import { sanitizeHtml } from '$lib/utils/functions/sanitize';
  import { t } from '$lib/utils/functions/translations';

  import { LOCALE } from '$lib/utils/types';
  import { snackbar } from '$lib/components/Snackbar/store';

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
      if (!body) return;

      body.style.overflow = open ? 'hidden' : 'auto';
    }
  }

  function formatTimestamp(timestamp) {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
    const date = new Date(timestamp + 'Z');
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  function handleDrawerClose() {
    dispatch('close');
  }

  function getMinutes(time: Date) {
    return new Date(time).getMinutes();
  }

  function removeDuplicate(history: LessonHistory[]) {
    return history.filter(
      (obj1, i, arr) =>
        arr.findIndex((obj2) => getMinutes(obj2.timestamp) === getMinutes(obj1.timestamp)) === i
    );
  }

  async function fetchLessonHistory(lessonId: string, locale: string, endRange: number) {
    try {
      isMoreHistoryLoading = true;
      const { data, error } = await fetchLesssonLanguageHistory(lessonId, locale, endRange);

      if (!data) {
        throw error;
      }

      // Filter out duplicates based on timestamp
      const existingTimestamps = new Set(
        lessonHistory.map((item) => new Date(item.timestamp).getMinutes())
      );
      const newEntries = data.filter(
        (item) => !existingTimestamps.has(new Date(item.timestamp).getMinutes())
      );
      lessonHistory = removeDuplicate([...lessonHistory, ...newEntries]);

      updateContentVersion(lessonHistory[0], 0);
    } catch (error) {
      console.error(error);
      snackbar.error('Failed to fetch history');
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
      snackbar.error('Failed to restore');
    } finally {
      contentRestoreLoading = false;
      dispatch('restore');
    }
  }

  function loadMoreHistory() {
    versionsToFetch += 10;
  }

  $: lessonTitle = $lessons.find((les) => les.id === $lesson.id)?.title || '';
  $: lessonId = $lesson.id || '';
  $: scrollLock(open);
  $: fetchLessonHistory(lessonId, $lesson.locale, versionsToFetch);
</script>

<aside class="drawer bg-gray-100 dark:bg-neutral-800" class:open>
  <div class="panel bg-white dark:bg-black">
    <div class="w-full p-10 pr-80">
      <div class="flex items-start gap-x-10">
        <PrimaryButton variant={VARIANTS.OUTLINED} onClick={handleDrawerClose}>
          <ArrowLeft />
        </PrimaryButton>

        {#if selectedVersionIndex != 0}
          <div class="">
            <PrimaryButton isLoading={contentRestoreLoading} onClick={restoreSelectedVersion}
              >{$t('course.navItem.lessons.version_history.restore_version')}</PrimaryButton
            >
          </div>
        {/if}
      </div>
      <div class="flex h-full w-full flex-col items-start">
        <HtmlRender className="m-auto text-center mt-6 flex items-center justify-center">
          <svelte:fragment slot="content">
            <h1 class="mt-0 text-2xl capitalize md:text-4xl">
              {lessonTitle}
            </h1>
          </svelte:fragment>
        </HtmlRender>

        {#key lessonId}
          <HtmlRender id="display" className="m-auto">
            <svelte:fragment slot="content">
              <div class="amen">
                {@html sanitizeHtml(content)}
              </div>
            </svelte:fragment>
          </HtmlRender>
        {/key}
      </div>
    </div>
  </div>
  <div
    id="scroll-container"
    class="fixed right-0 top-0 z-10 h-full min-h-screen w-80 space-y-6 overflow-x-auto overflow-y-scroll bg-gray-100 py-10 dark:bg-neutral-800"
  >
    <p class="flex items-start justify-start px-10 text-left text-xl font-medium">
      {$t('course.navItem.lessons.version_history.title')}
    </p>

    <div>
      {#each lessonHistory as version, index}
        <button
          on:click={() => updateContentVersion(version, index)}
          class="flex w-full cursor-pointer items-start p-4 px-10 hover:bg-gray-200 dark:hover:bg-neutral-700 {index ==
          selectedVersionIndex
            ? 'bg-gray-200 dark:bg-neutral-700'
            : ''}"
        >
          <CaretRight class="mt-1"></CaretRight>
          <div>
            <span class="inline-block text-base font-medium"
              >{formatTimestamp(version.timestamp)}</span
            >
            {#if index == 0}
              <span class="block text-start text-xs italic"
                >{$t('course.navItem.lessons.version_history.current_version')}</span
              >
            {/if}
          </div>
        </button>
      {/each}
      <div class="mt-2 flex h-10 items-center justify-start px-10">
        <PrimaryButton className="h-full" isLoading={isMoreHistoryLoading} onClick={loadMoreHistory}
          >{$t('course.navItem.lessons.version_history.fetch_more_versions')}</PrimaryButton
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
