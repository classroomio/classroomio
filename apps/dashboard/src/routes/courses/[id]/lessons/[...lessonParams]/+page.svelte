<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { env } from '$env/dynamic/public';
  import { CourseContainer } from '$lib/components/Course';
  import {
    checkExercisesComplete,
    fetchLesson,
    updateLessonCompletion
  } from '$lib/utils/services/courses';
  import { globalStore } from '$lib/utils/store/app';
  import CheckmarkFilledIcon from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import CheckmarkOutlineIcon from 'carbon-icons-svelte/lib/CheckmarkOutline.svelte';
  import ListChecked from 'carbon-icons-svelte/lib/ListChecked.svelte';

  import { browser } from '$app/environment';
  import { apps } from '$lib/components/Apps/store';
  import Exercises from '$lib/components/Course/components/Lesson/Exercises/index.svelte';
  import { getIsLessonComplete } from '$lib/components/Course/components/Lesson/functions';
  import LessonVersionHistory from '$lib/components/Course/components/Lesson/LessonVersionHistory.svelte';
  import Materials from '$lib/components/Course/components/Lesson/Materials/index.svelte';
  import {
    lesson,
    lessonByTranslation,
    lessons,
    lessonSections
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { getGroupMemberId } from '$lib/components/Course/function';
  import { course, group } from '$lib/components/Course/store';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import { PageBody, PageNav } from '$lib/components/Page';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { RoleBasedSecurity } from '$lib/components/RoleBasedSecurity';
  import { snackbar } from '$lib/components/Snackbar/store';
  import MODES from '$lib/utils/constants/mode';
  import { LANGUAGES } from '$lib/utils/constants/translation';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { COURSE_VERSION, type Lesson, type LessonCompletion } from '$lib/utils/types';
  import { Dropdown } from 'carbon-components-svelte';
  import { ChevronLeft, ChevronRight, Edit, Save } from 'carbon-icons-svelte';
  import Download from 'carbon-icons-svelte/lib/Download.svelte';
  import OverflowMenuVertical from 'carbon-icons-svelte/lib/OverflowMenuVertical.svelte';
  import ResultOld from 'carbon-icons-svelte/lib/ResultOld.svelte';

  export let data;

  let path = '';
  let mode = MODES.view;
  let prevMode = '';
  let isMarkingComplete = false;
  let isLoading = false;
  let isSaving = false;
  let isLessonComplete = false;
  let isVersionDrawerOpen = false;

  function getLessonOrder(id: string) {
    const index = $lessons.findIndex((lesson) => lesson.id === id);

    if (index < 10) {
      return '0' + (index + 1);
    } else {
      return index + 1;
    }
  }

  async function fetchReqData(lessonId = '', isMaterialsTabActive: boolean) {
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
    setLesson(lessonData, totalExercises, totalComments);
    $lesson.isFetching = false;
  }

  async function markLessonComplete(lessonId: string) {
    const groupMemberId = getGroupMemberId($group.people, $profile.id);
    const { data: areExercisesComplete, error } = await checkExercisesComplete(
      lessonId,
      groupMemberId
    );

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

  const downloadLesson = async () => {
    const currentLesson = $lessons.find((l) => l.id === $lesson?.id);
    if (!currentLesson) {
      return;
    }

    isLoading = true;

    try {
      const lessonVideo = $lesson.materials.videos.map((video) => video.link);
      const lessonNumber = getLessonOrder(currentLesson.id);
      const slideUrl = $lesson.materials.slide_url || '';

      const response = await fetch(env.PUBLIC_SERVER_URL + '/downloadLesson', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: currentLesson.title,
          number: lessonNumber,
          orgName: $currentOrg.name,
          note: $lesson.materials.note,
          slideUrl: slideUrl,
          video: lessonVideo,
          courseTitle: $course.title
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.blob();
      console.log(data);
      const file = new Blob([data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);

      let a = document.createElement('a');
      document.body.append(a);
      a.download = $course.title + ' - ' + 'Lesson ' + lessonNumber;
      a.href = fileURL;
      a.click();
      a.remove();

      snackbar.success('snackbar.lessons.success.complete_download');
    } catch (error) {
      console.log('error downloading lesson', error);
      snackbar.error('snackbar.lessons.error.try_later');
    }

    isLoading = false;
  };

  function setLesson(lessonData, totalExercises: number, totalComments: number) {
    if (!lessonData) return;

    let lesson_completion: LessonCompletion[] = [];

    if (Array.isArray(lessonData.lesson_completion)) {
      lesson_completion = [...lessonData.lesson_completion];
    }

    lesson.update((l) => ({
      ...l,
      id: data.lessonId,
      title: lessonData.title,
      totalExercises,
      totalComments: totalComments,
      materials: {
        videos: lessonData.videos,
        note: lessonData.note,
        slide_url: lessonData.slide_url
      },
      lesson_completion,
      exercises: [],
      locale: $profile.locale
    }));

    if (Array.isArray(lessonData.lesson_language)) {
      lessonByTranslation.update((lessLocales) => {
        return {
          ...lessLocales,
          [data.lessonId]: lessonData.lesson_language.reduce(
            (acc, cur) => {
              acc[cur.locale] = cur.content;
              return acc;
            },
            {
              en: ''
            }
          )
        };
      });
    }
  }

  const toggleApps = () => {
    $apps.open = !$apps.open;
  };

  function toggleMode() {
    prevMode = mode;
    mode = mode === MODES.edit ? MODES.view : MODES.edit;
  }

  function handleAppClick(appName: string) {
    if ($apps.selectedApp === appName) {
      $apps.selectedApp = undefined;
      $apps.open = false;
      return;
    }

    $apps.selectedApp = appName;
    $apps.open = true;
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
      fetchReqData(data.lessonId, data.isMaterialsTabActive);
    }
    snackbar.success('snackbar.lessons.success.version_restored');
  };

  $: path = $page.url?.pathname?.replace(/\/exercises[\/ 0-9 a-z -]*/, '');

  $: if (data.courseId && $profile.id && browser) {
    mode = MODES.view;
    fetchReqData(data.lessonId, data.isMaterialsTabActive);
  }

  $: isLessonComplete = getIsLessonComplete($lesson.lesson_completion, $profile.id);
  $: isPrevDisabled = isNextOrPrevDisabled(data.lessonId, true);
  $: isNextDisabled = isNextOrPrevDisabled(data.lessonId, false);
</script>

<CourseContainer
  {path}
  isExercisePage={!data.isMaterialsTabActive && !!data.exerciseId}
  bind:courseId={data.courseId}
  containerClass="relative"
>
  <PageNav
    bind:hideOnMobile={$globalStore.isStudent}
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
    <svelte:fragment slot="widget">
      <div class="flex items-center gap-1">
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          {#if data.isMaterialsTabActive}
            <!-- Version control -->
            {#if mode === MODES.edit && window.innerWidth >= 1024}
              <IconButton onClick={() => (isVersionDrawerOpen = true)}>
                <ResultOld size={24} />
              </IconButton>
            {/if}

            <div class="tab">
              <IconButton onClick={toggleApps} buttonClassName="">
                <OverflowMenuVertical size={24} />
              </IconButton>
            </div>
            <div
              class={`flex-row ${
                $apps.dropdown && $apps.open
                  ? 'absolute right-14 top-[85px] z-40 rounded-md bg-gray-100 p-3 dark:bg-neutral-800 lg:relative lg:right-0 lg:top-0 lg:p-0'
                  : 'hidden'
              } items-center lg:flex`}
            >
              <IconButton
                onClick={() => {
                  $apps.dropdown = false;
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

              {#if $course.metadata.lessonDownload && !!env.PUBLIC_SERVER_URL}
                <PrimaryButton
                  className="mr-"
                  variant={VARIANTS.OUTLINED}
                  onClick={downloadLesson}
                  {isLoading}
                >
                  <Download size={16} />
                </PrimaryButton>
              {/if}
            </div>

            <Dropdown items={LANGUAGES} bind:selectedId={$lesson.locale} class="h-full" />
          {/if}
        </RoleBasedSecurity>
      </div>
    </svelte:fragment>
  </PageNav>

  {#if !data.isMaterialsTabActive}
    <Exercises lessonId={data.lessonId} exerciseId={data.exerciseId} path={`${path}/exercises`} />
  {:else if !!data.lessonId}
    <PageBody
      bind:isPageNavHidden={$globalStore.isStudent}
      width="lg:w-full xl:w-11/12"
      className="overflow-x-hidden"
    >
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
    <div
      class="flex w-fit items-center gap-2 rounded-full bg-gray-100 px-5 py-1 shadow-xl dark:bg-neutral-700"
    >
      <button
        disabled={isPrevDisabled}
        class={`my-2 flex items-center border border-b-0 border-l-0 border-t-0 border-gray-300 px-2 pr-4 ${
          isPrevDisabled && 'cursor-not-allowed opacity-25'
        }`}
        on:click={() => goToNextOrPrevLesson(data.lessonId, true)}
      >
        <ChevronLeft size={24} />

        <span class="hidden md:block">{$t('course.navItem.lessons.prev')}</span>
      </button>
      {#if data.isMaterialsTabActive}
        <button
          class="my-2 flex items-center border border-b-0 border-l-0 border-t-0 border-gray-300 px-2 pr-4"
          on:click={() => goto(`${path}/exercises`)}
        >
          <ListChecked size={24} class="carbon-icon" />
          <span class="ml-1">{$lesson.totalExercises}</span>
        </button>
      {:else}
        <button
          class="my-2 flex items-center border border-b-0 border-l-0 border-t-0 border-gray-300 px-2 pr-4"
          on:click={() => goto(path)}
        >
          <CourseIcon />
        </button>
      {/if}
      <button
        class="my-2 flex items-center border border-b-0 border-l-0 border-t-0 border-gray-300 px-2 pr-4"
        on:click={() => markLessonComplete(data.lessonId)}
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
        on:click={() => goToNextOrPrevLesson(data.lessonId, false)}
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
