<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { CourseContainer } from '$lib/components/CourseContainer';
  import { checkExercisesComplete, fetchLesson, updateLessonCompletion } from '$lib/utils/services/courses';
  import { globalStore } from '$lib/utils/store/app';
  import CheckmarkFilledIcon from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import CheckmarkOutlineIcon from 'carbon-icons-svelte/lib/CheckmarkOutline.svelte';
  import ListChecked from 'carbon-icons-svelte/lib/ListChecked.svelte';

  import { browser } from '$app/environment';
  import Exercises from '$lib/components/Course/components/Lesson/Exercises/index.svelte';
  import { getIsLessonComplete } from '$lib/components/Course/components/Lesson/functions';
  import LessonVersionHistory from '$lib/components/Course/components/Lesson/LessonVersionHistory.svelte';
  import Materials from '$lib/components/Course/components/Lesson/Materials/index.svelte';
  import { lesson, setLesson, lessons, lessonSections } from '$lib/components/Course/components/Lesson/store/lessons';
  import { getGroupMemberId } from '$lib/components/Course/function';
  import { course, group } from '$lib/components/Course/store';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import { PageBody, PageNav } from '$lib/components/Page';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import MODES from '$lib/utils/constants/mode';
  import { LANGUAGES } from '$lib/utils/constants/translation';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { COURSE_VERSION, type Lesson, type LessonCompletion } from '$lib/utils/types';
  import { Dropdown } from 'carbon-components-svelte';
  import { ChevronLeft, ChevronRight, Edit, Save } from 'carbon-icons-svelte';
  import ResultOld from 'carbon-icons-svelte/lib/ResultOld.svelte';

  let { data = $bindable() } = $props();

  let mode = $state(MODES.view);
  let prevMode = $state('');
  let isMarkingComplete = $state(false);
  let isSaving = $state(false);
  let isVersionDrawerOpen = $state(false);
  let hasFetched = $state(false);

  const path = $derived(page.url?.pathname?.replace(/\/exercises[\/ 0-9 a-z -]*/, ''));
  const isLessonComplete = $derived(getIsLessonComplete($lesson.lesson_completion, $profile.id));

  async function fetchReqData(lessonId = '', isMaterialsTabActive: boolean) {
    if (hasFetched) return;

    hasFetched = true;

    const timeout = setTimeout(() => {
      $lesson.isFetching = true;
    }, 500);

    let lessonData;
    if (isMaterialsTabActive) {
      const lesson = await fetchLesson(lessonId);
      lessonData = lesson.data;

      clearTimeout(timeout);
    }

    console.log({ lessonData });

    const totalExercises = lessonData?.totalExercises?.[0]?.count || 0;
    const totalComments = lessonData?.totalComments?.[0]?.count || 0;

    setLesson({
      id: lessonId,
      lessonData,
      totalExercises,
      totalComments,
      locale: $profile.locale
    });
    $lesson.isFetching = false;
  }

  async function markLessonComplete(lessonId: string) {
    const groupMemberId = getGroupMemberId($group.people, $profile.id);
    const { data: areExercisesComplete, error } = await checkExercisesComplete(lessonId, groupMemberId);

    if (error) {
      snackbar.error('snackbar.lessons.error.try_later');
      return;
    }

    if (!areExercisesComplete) {
      snackbar.error('snackbar.lessons.error.exercise_not_complete');
      return;
    }

    isMarkingComplete = true;

    let newCompletion: LessonCompletion = {
      is_complete: true,
      profile_id: $profile.id || '',
      lesson_id: lessonId,
      created_at: new Date().toDateString(),
      updated_at: new Date().toDateString()
    };
    let updatedCompletion: LessonCompletion;

    const completions: LessonCompletion[] = $lesson.lesson_completion.map((completion) => {
      if (completion.profile_id === $profile.id) {
        console.log('shouldUpdate');

        completion = {
          ...completion,
          is_complete: !completion.is_complete
        };

        updatedCompletion = completion;
      }

      return completion;
    });

    // @ts-ignore
    if (updatedCompletion) {
      await updateLessonCompletion(updatedCompletion, true);
    } else {
      completions.push(newCompletion);
      await updateLessonCompletion(newCompletion, false);
    }

    $lesson.lesson_completion = completions;
    $lessons = $lessons.map((l) => {
      if (l.id === $lesson.id) {
        l.lesson_completion = completions;
      }

      return l;
    });
    snackbar.success('snackbar.lessons.success.complete_marked');
    isMarkingComplete = false;
  }

  function toggleMode() {
    prevMode = mode;
    mode = mode === MODES.edit ? MODES.view : MODES.edit;
  }

  const getLessons = () => {
    if ($course.version === COURSE_VERSION.V1) {
      return $lessons;
    } else {
      const _lessons: Lesson[] = [];

      $lessonSections.forEach((section) => {
        _lessons.push(...section.lessons);
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

    const isLocked = $globalStore.isStudent && !nextOrPrevLesson.is_unlocked;

    if (isLocked) return;

    const path = `/courses/${$course.id}/lessons/${nextOrPrevLesson.id}`;
    goto(path);
  };

  const refetchDataAfterVersionRestore = () => {
    isVersionDrawerOpen = false;
    if (data.courseId && browser) {
      mode = MODES.view;
      hasFetched = false;
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

<CourseContainer
  {path}
  containerClass="relative"
  courseId={data.courseId}
  isExercisePage={!data.isMaterialsTabActive && !!data.exerciseId}
>
  <PageNav
    hideOnMobile={$globalStore.isStudent}
    navItems={[
      {
        label: $t('course.navItem.lessons.lesson_nav.materials'),
        isActive: data.isMaterialsTabActive,
        href: path
      },
      {
        label: $t('course.navItem.lessons.lesson_nav.exercises'),
        badgeValue: data.isMaterialsTabActive ? $lesson.totalExercises : $lesson.exercises.length,
        isActive: !data.isMaterialsTabActive,
        href: `${path}/exercises`
      }
    ]}
  >
    {#snippet widget()}
      <div class="flex items-center gap-1">
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          {#if data.isMaterialsTabActive}
            <!-- Version control -->
            {#if mode === MODES.edit && window.innerWidth >= 1024}
              <IconButton onClick={() => (isVersionDrawerOpen = true)}>
                <ResultOld size={24} />
              </IconButton>
            {/if}

            <div class="hidden flex-row items-center lg:flex">
              <IconButton
                onClick={() => {
                  toggleMode();
                }}
                disabled={isSaving}
              >
                {#if mode === MODES.edit}
                  <Save size={24} />
                {:else}
                  <Edit size={24} />
                {/if}
              </IconButton>
            </div>

            <Dropdown items={LANGUAGES} bind:selectedId={$lesson.locale} class="h-full" />
          {/if}
        </RoleBasedSecurity>
      </div>
    {/snippet}
  </PageNav>

  {#if !data.isMaterialsTabActive}
    <Exercises lessonId={data.lessonId} exerciseId={data.exerciseId} path={`${path}/exercises`} />
  {:else if !!data.lessonId}
    <PageBody isPageNavHidden={$globalStore.isStudent} width="lg:w-full xl:w-11/12" className="overflow-x-hidden">
      <!-- Shows Lesson Note / Slides / Video -->
      <Materials
        lessonId={data.lessonId}
        {mode}
        {prevMode}
        {toggleMode}
        bind:isSaving
        isStudent={$globalStore.isStudent}
      />
    </PageBody>
  {/if}

  <!-- Bottom Lesson Widget -->
  <div class="absolute bottom-5 flex w-full items-center justify-center">
    <div class="flex w-fit items-center gap-2 rounded-full bg-gray-100 px-5 py-1 shadow-xl dark:bg-neutral-700">
      <button
        disabled={isPrevDisabled}
        class={`my-2 flex items-center border border-b-0 border-l-0 border-t-0 border-gray-300 px-2 pr-4 ${
          isPrevDisabled && 'cursor-not-allowed opacity-25'
        }`}
        onclick={() => goToNextOrPrevLesson(data.lessonId, true)}
      >
        <ChevronLeft size={24} />

        <span class="hidden md:block">{$t('course.navItem.lessons.prev')}</span>
      </button>
      {#if data.isMaterialsTabActive}
        <button
          class="my-2 flex items-center border border-b-0 border-l-0 border-t-0 border-gray-300 px-2 pr-4"
          onclick={() => goto(`${path}/exercises`)}
        >
          <ListChecked size={24} class="carbon-icon" />
          <span class="ml-1">{$lesson.totalExercises}</span>
        </button>
      {:else}
        <button
          class="my-2 flex items-center border border-b-0 border-l-0 border-t-0 border-gray-300 px-2 pr-4"
          onclick={() => goto(path)}
        >
          <CourseIcon />
        </button>
      {/if}
      <button
        class="my-2 flex items-center border border-b-0 border-l-0 border-t-0 border-gray-300 px-2 pr-4"
        onclick={() => markLessonComplete(data.lessonId)}
        disabled={isMarkingComplete}
      >
        {#if isLessonComplete}
          <CheckmarkFilledIcon size={24} class="carbon-icon text-primary-600" />
        {:else}
          <CheckmarkOutlineIcon size={24} class="carbon-icon" />
        {/if}
      </button>
      <button
        disabled={isNextDisabled}
        class={`my-2 flex items-center px-2 ${isNextDisabled && 'cursor-not-allowed opacity-25'}`}
        onclick={() => goToNextOrPrevLesson(data.lessonId, false)}
      >
        <span class="hidden md:block">{$t('course.navItem.lessons.next')}</span>
        <ChevronRight size={24} />
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
</CourseContainer>

<style>
  @media screen and (min-width: 1023px) {
    .tab {
      display: none;
    }
  }
</style>
