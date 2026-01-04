<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import Save from '@lucide/svelte/icons/save';
  import * as Select from '@cio/ui/base/select';
  import Pencil from '@lucide/svelte/icons/pencil';
  import HistoryIcon from '@lucide/svelte/icons/history';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { CircleCheckIcon } from '$features/ui/icons';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';

  import MODES from '$lib/utils/constants/mode';
  import { profile } from '$lib/utils/store/user';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { courseApi } from '$features/course/api';
  import { LANGUAGES } from '$lib/utils/constants/translation';
  import type { TLocale } from '@cio/db/types';
  import LessonVersionHistory from '$features/course/components/lesson/lesson-version-history.svelte';
  import { lessonApi } from '$features/course/api';

  import { IconButton } from '@cio/ui/custom/icon-button';
  import * as Page from '@cio/ui/base/page';
  import { RoleBasedSecurity } from '$features/ui';
  import Exercises from '$features/course/components/lesson/exericses/index.svelte';
  import Materials from '$lib/features/course/components/lesson/materials/index.svelte';
  import type { ListLessons } from '$features/course/utils/types';

  let { data = $bindable() } = $props();

  let mode = $state(MODES.view);
  let prevMode = $state('');
  let isMarkingComplete = $state(false);
  let isSaving = $state(false);
  let isVersionDrawerOpen = $state(false);
  let hasFetched = $state('');

  const path = $derived(page.url?.pathname?.replace(/\/exercises[\/ 0-9 a-z -]*/, ''));
  const isLessonComplete = $derived.by(() => {
    const lesson = lessonApi.lessons.find((l) => l.id === data.lessonId);
    return lesson?.isComplete ?? false;
  });

  async function fetchReqData(lessonId = '', isMaterialsTabActive: boolean) {
    if (lessonId === lessonApi.lesson?.id) return;

    if (!lessonId || hasFetched === lessonId) return;

    hasFetched = lessonId;

    lessonApi.isLoading = true;
    console.log('fetching', lessonApi.isLoading);

    if (isMaterialsTabActive) {
      await lessonApi.get(data.courseId, lessonId);
      if (lessonApi.success && lessonApi.lesson) {
        if ($profile.locale) {
          lessonApi.currentLocale = $profile.locale;
        }
      }
    }

    lessonApi.isLoading = false;
  }

  async function markLessonComplete(lessonId: string) {
    isMarkingComplete = true;

    // Get current completion status from the lesson in state
    const lesson = lessonApi.lessons.find((l) => l.id === lessonId);
    const currentIsComplete = lesson?.isComplete ?? false;

    const isComplete = !currentIsComplete;

    // Update completion
    await lessonApi.updateCompletion(data.courseId, lessonId, isComplete);

    if (lessonApi.success) {
      snackbar.success('snackbar.lessons.success.complete_marked');
    } else {
      snackbar.error('snackbar.lessons.error.try_later');
    }

    isMarkingComplete = false;
  }

  function toggleMode() {
    prevMode = mode;
    mode = mode === MODES.edit ? MODES.view : MODES.edit;
  }

  const getLessons = () => {
    if (courseApi.course?.version === 'V1') {
      return lessonApi.lessons;
    } else {
      // For V2, filter lessons by section
      const _lessons: ListLessons = [];
      lessonApi.sections.forEach((section) => {
        const sectionLessons = lessonApi.lessons.filter((lesson) => lesson.sectionId === section.id);
        _lessons.push(...sectionLessons);
      });
      return _lessons;
    }
  };

  const isNextOrPrevDisabled = (lessonId: string, isPrev: boolean) => {
    const _lessons = getLessons();
    const index = _lessons.findIndex((lesson) => lesson.id === lessonId);

    return isPrev ? !_lessons[index - 1] : !_lessons[index + 1];
  };

  const goToNextOrPrevLesson = (lessonId: string, isPrev: boolean) => {
    const _lessons = getLessons();
    const isDisabled = isNextOrPrevDisabled(lessonId, isPrev);

    // Always use early return
    if (isDisabled) return;

    const index = _lessons.findIndex((lesson) => lesson.id === lessonId);
    const nextOrPrevLesson = isPrev ? _lessons[index - 1] : _lessons[index + 1];

    const isLocked = $globalStore.isStudent && !nextOrPrevLesson.isUnlocked;

    if (isLocked) return;

    const path = `/courses/${courseApi.course?.id}/lessons/${nextOrPrevLesson.id}`;
    goto(path);
  };

  const refetchDataAfterVersionRestore = () => {
    isVersionDrawerOpen = false;
    if (data.courseId && browser) {
      mode = MODES.view;
      hasFetched = '';
      fetchReqData(data.lessonId, data.isMaterialsTabActive);
    }

    snackbar.success('snackbar.lessons.success.version_restored');
  };

  $effect(() => {
    if (data.courseId && $profile.id) {
      fetchReqData(data.lessonId, data.isMaterialsTabActive);
    }
  });

  const isPrevDisabled = $derived(isNextOrPrevDisabled(data.lessonId, true));
  const isNextDisabled = $derived(isNextOrPrevDisabled(data.lessonId, false));
</script>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>
      {data.isMaterialsTabActive
        ? $t('course.navItem.lessons.lesson_nav.materials')
        : $t('course.navItem.lessons.lesson_nav.exercises')}
    </Page.Title>
  </Page.HeaderContent>
  <Page.Action>
    <div class="flex items-center gap-1">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        {#if data.isMaterialsTabActive}
          <!-- Version control -->
          {#if mode === MODES.edit && window.innerWidth >= 1024}
            <IconButton onclick={() => (isVersionDrawerOpen = true)}>
              <HistoryIcon size={20} />
            </IconButton>
          {/if}

          <div class="flex-row items-center lg:flex">
            <IconButton
              onclick={() => {
                toggleMode();
              }}
              disabled={isSaving}
            >
              {#if mode === MODES.edit}
                <Save size={20} />
              {:else}
                <Pencil size={20} />
              {/if}
            </IconButton>
          </div>

          <Select.Root
            type="single"
            value={lessonApi.currentLocale}
            onValueChange={(value) => {
              if (value) {
                lessonApi.currentLocale = value as TLocale;
              }
            }}
          >
            <Select.Trigger class="h-9 w-[120px]">
              {LANGUAGES.find(
                (lang) => lang.id === (Object.keys(lessonApi.translations[data.lessonId || ''] || {})[0] || 'en')
              )?.text || 'Language'}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                {#each LANGUAGES as lang}
                  <Select.Item value={lang.id}>
                    {lang.text}
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        {/if}
      </RoleBasedSecurity>
    </div>
  </Page.Action>

  <UnderlineTabs.Root value="note">
    <UnderlineTabs.List>
      <UnderlineTabs.Trigger value="note" onclick={() => goto(path)}>Materials</UnderlineTabs.Trigger>
      <UnderlineTabs.Trigger value="exercises" onclick={() => goto(`${path}/exercises`)}
        >Exercises</UnderlineTabs.Trigger
      >
    </UnderlineTabs.List>
  </UnderlineTabs.Root>
</Page.Header>

{#if !data.isMaterialsTabActive}
  <Exercises lessonId={data.lessonId} exerciseId={data.exerciseId} path={`${path}/exercises`} />
{:else if !!data.lessonId}
  <div class="overflow-x-hidden lg:w-full xl:w-11/12">
    <!-- Shows Lesson Note / Slides / Video -->
    <Materials
      lessonId={data.lessonId}
      {mode}
      {prevMode}
      {toggleMode}
      bind:isSaving
      isStudent={$globalStore.isStudent}
    />
  </div>
{/if}

<!-- Bottom Lesson Widget -->
<div class="absolute bottom-5 flex w-full items-center justify-center">
  <div class="flex w-fit items-center gap-2 rounded-full bg-gray-100 px-5 py-1 shadow-xl dark:bg-neutral-700">
    <button
      disabled={isPrevDisabled}
      class={`my-2 flex items-center border border-t-0 border-b-0 border-l-0 border-gray-300 px-2 pr-4 ${
        isPrevDisabled && 'cursor-not-allowed opacity-25'
      }`}
      onclick={() => goToNextOrPrevLesson(data.lessonId, true)}
    >
      <ChevronLeftIcon size={16} />

      <span class="hidden md:block">{$t('course.navItem.lessons.prev')}</span>
    </button>
    {#if data.isMaterialsTabActive}
      <button
        class="my-2 flex items-center border border-t-0 border-b-0 border-l-0 border-gray-300 px-2 pr-4"
        onclick={() => goto(`${path}/exercises`)}
      >
        <ListChecksIcon size={16} />
        <span class="ml-1">
          {(lessonApi.lessons.find((l) => l.id === data.lessonId) as any)?.totalExercises || 0}
        </span>
      </button>
    {:else}
      <button
        class="my-2 flex items-center border border-t-0 border-b-0 border-l-0 border-gray-300 px-2 pr-4"
        onclick={() => goto(path)}
      >
        <LibraryBigIcon size={16} />
      </button>
    {/if}
    <button
      class="my-2 flex items-center border border-t-0 border-b-0 border-l-0 border-gray-300 px-2 pr-4"
      onclick={() => markLessonComplete(data.lessonId)}
      disabled={isMarkingComplete}
    >
      <CircleCheckIcon filled={isLessonComplete} />
    </button>
    <button
      disabled={isNextDisabled}
      class={`my-2 flex items-center px-2 ${isNextDisabled && 'cursor-not-allowed opacity-25'}`}
      onclick={() => goToNextOrPrevLesson(data.lessonId, false)}
    >
      <span class="hidden md:block">{$t('course.navItem.lessons.next')}</span>
      <ChevronRightIcon size={16} />
    </button>
  </div>
</div>

<!-- Version Control Preview -->
{#if isVersionDrawerOpen && window.innerWidth >= 1024}
  <LessonVersionHistory
    open={isVersionDrawerOpen}
    on:close={() => (isVersionDrawerOpen = false)}
    on:restore={refetchDataAfterVersionRestore}
  />
{/if}

<style>
  @media screen and (min-width: 1023px) {
    .tab {
      display: none;
    }
  }
</style>
