<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import { PUBLIC_SERVER_URL } from '$env/static/public';
  import { fetchLesson, updateLessonCompletion } from '$lib/utils/services/courses';
  import CheckmarkOutlineIcon from 'carbon-icons-svelte/lib/CheckmarkOutline.svelte';
  import CheckmarkFilledIcon from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import ListChecked from 'carbon-icons-svelte/lib/ListChecked.svelte';
  import { globalStore } from '$lib/utils/store/app';

  import SendAlt from 'carbon-icons-svelte/lib/SendAlt.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { Dropdown, Loading } from 'carbon-components-svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import Materials from '$lib/components/Course/components/Lesson/Materials/index.svelte';
  import Exercises from '$lib/components/Course/components/Lesson/Exercises/index.svelte';
  import LanguageLessonVersionHistory from '$lib/components/Course/components/Lesson/LanguageLessonVersionHistory.svelte';
  import MODES from '$lib/utils/constants/mode';
  import { course } from '$lib/components/Course/store';
  import Download from 'carbon-icons-svelte/lib/Download.svelte';
  import ResultOld from 'carbon-icons-svelte/lib/ResultOld.svelte';
  import OverflowMenuVertical from 'carbon-icons-svelte/lib/OverflowMenuVertical.svelte';
  import { apps } from '$lib/components/Apps/store';
  import APPS_CONSTANTS from '$lib/components/Apps/constants';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import {
    lesson,
    lessons,
    lessonByTranslation
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { browser } from '$app/environment';
  import { currentOrg } from '$lib/utils/store/org';
  import { snackbar } from '$lib/components/Snackbar/store';
  import type { LessonCompletion } from '$lib/utils/types';
  import { profile } from '$lib/utils/store/user';
  import { getIsLessonComplete } from '$lib/components/Course/components/Lesson/functions';
  import { t } from '$lib/utils/functions/translations';
  import { LANGUAGES } from '$lib/utils/constants/translation';
  import { ChevronLeft, ChevronRight } from 'carbon-icons-svelte';

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
    }, 1000);
    let lessonData;
    if (isMaterialsTabActive) {
      const lesson = await fetchLesson(lessonId);
      lessonData = lesson.data;

      clearTimeout(timeout);
    }

    console.log({ lessonData });

    const totalExercises = lessonData?.totalExercises?.[0] && lessonData.totalExercises[0].count;
    const totalComments = lessonData?.totalComments?.[0] && lessonData.totalComments[0].count;
    setLesson(lessonData, totalExercises || 0, totalComments || 0);
    $lesson.isFetching = false;
  }

  async function markLessonComplete(lessonId: string) {
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

      const response = await fetch(PUBLIC_SERVER_URL + '/downloadLesson', {
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

  const isNextOrPrevDisabled = (lessonId: string, isPrev: boolean) => {
    const index = $lessons.findIndex((lesson) => lesson.id === lessonId);

    return isPrev ? !$lessons[index - 1] : !$lessons[index + 1];
  };

  const goToNextOrPrevLesson = (lessonId: string, isPrev: boolean) => {
    const isDisabled = isNextOrPrevDisabled(lessonId, isPrev);

    // Always use early return
    if (isDisabled) return;

    const index = $lessons.findIndex((lesson) => lesson.id === lessonId);
    const nextOrPrevLesson = isPrev ? $lessons[index - 1] : $lessons[index + 1];

    const isLocked = $globalStore.isStudent && !nextOrPrevLesson.is_unlocked;

    if (isLocked) return;

    const path = `/courses/${$course.id}/lessons/${nextOrPrevLesson.id}`;
    goto(path);
  };

  const refetchDataAfterVersionRestore = () => {
    isVersionDrawerOpen = false;
    if (data.courseId && browser) {
      mode = MODES.edit;
      fetchReqData(data.lessonId, data.isMaterialsTabActive);
    }
  };

  $: path = $page.url?.pathname?.replace(/\/exercises[\/ 0-9 a-z -]*/, '');

  $: if (data.courseId && browser) {
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
      <div class="flex items-center">
        <RoleBasedSecurity allowedRoles={[1, 2]}>
          {#if data.isMaterialsTabActive}
            <div class="mr-5">
              <Dropdown items={LANGUAGES} bind:selectedId={$lesson.locale} class="h-full" />
            </div>
            <!-- Version control -->
            {#if mode === MODES.edit && window.innerWidth >= 1024}
              <div>
                <PrimaryButton
                  className="mb-2 lg:mb-0 mr-2 h-full"
                  variant={VARIANTS.OUTLINED}
                  onClick={() => (isVersionDrawerOpen = true)}
                >
                  <ResultOld size={20}></ResultOld>
                </PrimaryButton>
              </div>
            {/if}

            <div class="tab">
              <IconButton onClick={toggleApps} buttonClassName="">
                <OverflowMenuVertical size={24} />
              </IconButton>
            </div>
            <div
              class={`flex-row ${
                $apps.dropdown && $apps.open
                  ? 'absolute lg:relative top-[85px] lg:top-0 right-14 lg:right-0 z-40 rounded-md bg-gray-100 dark:bg-neutral-800 p-3 lg:p-0'
                  : 'hidden'
              } lg:flex items-center`}
            >
              <PrimaryButton
                className="mb-2 lg:mb-0 mr-2"
                variant={VARIANTS.OUTLINED}
                onClick={() => {
                  $apps.dropdown = false;
                  toggleMode();
                }}
                isDisabled={isSaving}
              >
                {mode === MODES.edit
                  ? $t('course.navItem.lessons.done')
                  : $t('course.navItem.lessons.edit')}
              </PrimaryButton>

              {#if $course.metadata.lessonDownload && !!PUBLIC_SERVER_URL}
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
      onClick={() => {
        $apps.open = false;
        $apps.dropdown = false;
      }}
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
  <div class="absolute w-full bottom-5 flex items-center justify-center">
    <div
      class="flex items-center gap-2 w-fit rounded-full shadow-xl bg-gray-100 dark:bg-neutral-700 px-5 py-1"
    >
      <button
        disabled={isPrevDisabled}
        class={`px-2 my-2 pr-4 border-t-0 border-b-0 border-l-0 border border-gray-300 flex items-center ${
          isPrevDisabled && 'opacity-25 cursor-not-allowed'
        }`}
        on:click={() => goToNextOrPrevLesson(data.lessonId, true)}
      >
        <ChevronLeft size={24} />

        <span class="hidden md:block">{$t('course.navItem.lessons.prev')}</span>
      </button>
      {#if data.isMaterialsTabActive}
        <button
          class="px-2 my-2 pr-4 border-t-0 border-b-0 border-l-0 border border-gray-300 flex items-center"
          on:click={() => goto(`${path}/exercises`)}
        >
          <ListChecked size={24} class="carbon-icon" />
          <span class="ml-1">{$lesson.totalExercises}</span>
        </button>
      {:else}
        <button
          class="px-2 my-2 pr-4 border-t-0 border-b-0 border-l-0 border border-gray-300 flex items-center"
          on:click={() => goto(path)}
        >
          <CourseIcon />
        </button>
      {/if}
      <button
        class="px-2 my-2 pr-4 border-t-0 border-b-0 border-l-0 border border-gray-300 flex items-center disabled:opacity-10 disabled:cursor-not-allowed"
        on:click={() => handleAppClick(APPS_CONSTANTS.APPS.COMMENTS)}
        disabled={$globalStore.isStudent && !$currentOrg.customization.apps.comments}
      >
        <SendAlt size={24} class="carbon-icon" />
        <span class="ml-1">{$lesson.totalComments}</span>
      </button>
      <button
        class="px-2 my-2 pr-4 border-t-0 border-b-0 border-l-0 border border-gray-300 flex items-center"
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
        class={`px-2 my-2 flex items-center ${isNextDisabled && 'opacity-25 cursor-not-allowed'}`}
        on:click={() => goToNextOrPrevLesson(data.lessonId, false)}
      >
        <span class="hidden md:block">{$t('course.navItem.lessons.next')}</span>
        <ChevronRight size={24} />
      </button>
    </div>
  </div>

  <!-- Version Control Preview -->
  {#if isVersionDrawerOpen && window.innerWidth >= 1024}
    <LanguageLessonVersionHistory
      open={isVersionDrawerOpen}
      on:drawerClose={() => refetchDataAfterVersionRestore()}
    ></LanguageLessonVersionHistory>
  {/if}
</CourseContainer>

<style>
  @media screen and (min-width: 1023px) {
    .tab {
      display: none;
    }
  }
</style>
