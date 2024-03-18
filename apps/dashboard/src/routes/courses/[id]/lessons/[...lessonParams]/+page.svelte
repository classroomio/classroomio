<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import { PUBLIC_SERVER_URL } from '$env/static/public';
  import { fetchLesson, updateLessonCompletion } from '$lib/utils/services/courses';
  import CheckmarkOutlineIcon from 'carbon-icons-svelte/lib/CheckmarkOutline.svelte';
  import CheckmarkFilledIcon from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import ListChecked from 'carbon-icons-svelte/lib/ListChecked.svelte';

  import SendAlt from 'carbon-icons-svelte/lib/SendAlt.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { Loading } from 'carbon-components-svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import Materials from '$lib/components/Course/components/Lesson/Materials/index.svelte';
  import Exercises from '$lib/components/Course/components/Lesson/Exercises/index.svelte';
  import MODES from '$lib/utils/constants/mode';
  import { course } from '$lib/components/Course/store';
  import Download from 'carbon-icons-svelte/lib/Download.svelte';
  import OverflowMenuVertical from 'carbon-icons-svelte/lib/OverflowMenuVertical.svelte';
  import { apps } from '$lib/components/Apps/store';
  import APPS_CONSTANTS from '$lib/components/Apps/constants';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { lesson, lessons } from '$lib/components/Course/components/Lesson/store/lessons';
  import { browser } from '$app/environment';
  import { currentOrg } from '$lib/utils/store/org';
  import { snackbar } from '$lib/components/Snackbar/store';
  import type { LessonCompletion } from '$lib/utils/types';
  import { profile } from '$lib/utils/store/user';
  import { getIsLessonComplete } from '$lib/components/Course/components/Lesson/functions';
  import { t } from '$lib/utils/functions/translations.js';

  export let data;

  let path = '';
  let mode = MODES.view;
  let prevMode = '';
  let prevLessonId = '';
  let isFetching = false;
  let isMarkingComplete = false;
  let isLoading = false;
  let isSaving = false;
  let isStudent = true;
  let isLessonComplete = false;

  function getLessonOrder(id: string) {
    const index = $lessons.findIndex((lesson) => lesson.id === id);

    if (index < 10) {
      return '0' + (index + 1);
    } else {
      return index + 1;
    }
  }

  async function fetchReqData(lessonId = '', isMaterialsTabActive: boolean) {
    isFetching = true;

    let lessonData;
    if (isMaterialsTabActive) {
      const lesson = await fetchLesson(lessonId);
      lessonData = lesson.data;
    }

    console.log('lessonData', lessonData);
    prevLessonId = lessonId;

    const totalExercises = lessonData?.totalExercises?.[0] && lessonData.totalExercises[0].count;
    const totalComments = lessonData?.totalComments?.[0] && lessonData.totalComments[0].count;
    setLesson(lessonData, totalExercises || 0, totalComments || 0);
    isFetching = false;
  }

  async function markLessonComplete(lessonId: string) {
    let found = false;
    isMarkingComplete = true;

    let completion: LessonCompletion = {
      is_complete: true,
      profile_id: $profile.id || '',
      lesson_id: lessonId,
      created_at: new Date().toDateString(),
      updated_at: new Date().toDateString()
    };
    const completions: LessonCompletion[] = $lesson.lesson_completion.map((_completion) => {
      if (_completion.profile_id === $profile.id) {
        found = true;
        completion = {
          ...completion,
          is_complete: _completion.is_complete
        };
      }

      return _completion;
    });
    if (!found) {
      completions.push(completion);
    }

    $lesson.lesson_completion = completions;
    $lessons = $lessons.map((l) => {
      if (l.id === $lesson.id) {
        l.lesson_completion = completions;
      }

      return l;
    });

    await updateLessonCompletion(completion);
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
      exercises: []
    }));
  }

  const toggleApps = () => {
    $apps.open = !$apps.open;
  };

  function toggleMode() {
    prevMode = mode;
    mode = mode === MODES.edit ? MODES.view : MODES.edit;
  }

  function handleAppClick(appName: string) {
    $apps.selectedApp = appName;
    $apps.open = true;
  }

  $: path = $page.url?.pathname?.replace(/\/exercises[\/ 0-9 a-z -]*/, '');

  $: if (data.courseId && browser) {
    mode = MODES.view;
    fetchReqData(data.lessonId, data.isMaterialsTabActive);
  }

  $: isLessonComplete = getIsLessonComplete($lesson.lesson_completion, $profile.id);
</script>

<!-- TODO: Refactor usage of two way binding isStudent, rather use $globalStore.isStudent -->
<CourseContainer
  bind:isStudent
  {path}
  isExercisePage={!data.isMaterialsTabActive && data.exerciseId}
  bind:courseId={data.courseId}
>
  <PageNav
    bind:hideOnMobile={isStudent}
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
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        {#if data.isMaterialsTabActive}
          <div class="tab">
            <IconButton onClick={toggleApps} buttonClassName="">
              <OverflowMenuVertical size={24} />
            </IconButton>
          </div>
          <div
            class={`flex-row ${
              $apps.dropdown && $apps.open
                ? 'absolute lg:relative top-[85px] lg:top-0 right-14 lg:right-0 z-40 dark:bg-neutral-800 p-3 lg:p-0'
                : 'hidden'
            } lg:flex items-center`}
          >
            {#if $course.metadata.lessonDownload && !!PUBLIC_SERVER_URL}
              <PrimaryButton
                className="mb-2 lg:mb-0 mr-2"
                variant={VARIANTS.OUTLINED}
                onClick={downloadLesson}
                {isLoading}
              >
                <Download size={16} class="mr-2" />
                {$t('course.navItem.lessons.download_pdf')}
              </PrimaryButton>
            {/if}

            <PrimaryButton className="mr-2" variant={VARIANTS.OUTLINED} onClick={toggleMode}>
              {#if isSaving}
                <Loading withOverlay={false} small />
                <span class="text-sm ml-2 italic"> {$t('course.navItem.lessons.autosaving')}</span>
              {:else}
                {mode === MODES.edit
                  ? $t('course.navItem.lessons.done')
                  : $t('course.navItem.lessons.edit')}
              {/if}
            </PrimaryButton>
          </div>
        {/if}
      </RoleBasedSecurity>
    </svelte:fragment>
  </PageNav>

  {#if !data.isMaterialsTabActive}
    <Exercises
      bind:isStudent
      lessonId={data.lessonId}
      exerciseId={data.exerciseId}
      path={`${path}/exercises`}
    />
  {:else if !!data.lessonId}
    <PageBody
      bind:isPageNavHidden={isStudent}
      onClick={() => {
        $apps.open = false;
        $apps.dropdown = false;
      }}
      width="lg:w-full xl:w-11/12"
      className="overflow-x-hidden"
    >
      <Materials lessonId={data.lessonId} {mode} {prevMode} {toggleMode} bind:isSaving />
      {#if isStudent}
        <div class="w-full hidden lg:flex flex-row-reverse mt-10">
          <PrimaryButton
            onClick={() => markLessonComplete(data.lessonId)}
            isLoading={isMarkingComplete}
            isDisabled={isMarkingComplete}
            variant={VARIANTS.OUTLINED}
            className="mt-10"
          >
            {#if isLessonComplete}
              <CheckmarkFilledIcon size={24} class="carbon-icon text-primary-600 mr-2" />
            {:else}
              <CheckmarkOutlineIcon size={24} class="carbon-icon mr-2" />
            {/if}
            {$t('course.navItem.lessons.mark_as')}
            {isLessonComplete
              ? $t('course.navItem.lessons.incomplete')
              : $t('course.navItem.lessons.complete')}
          </PrimaryButton>
        </div>
      {/if}
    </PageBody>
  {/if}

  <!-- Mobile Navigation -->
  <div class="fixed bottom-5 w-[90%] flex items-center justify-center lg:hidden">
    <div
      class="flex items-center gap-2 w-fit rounded-full shadow-xl bg-gray-100 dark:bg-neutral-700 px-5 py-1"
    >
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
        class="px-2 my-2 pr-4 border-t-0 border-b-0 border-l-0 border border-gray-300 flex items-center"
        on:click={() => handleAppClick(APPS_CONSTANTS.APPS.COMMENTS)}
      >
        <SendAlt size={24} class="carbon-icon" />
        <span class="ml-1">{$lesson.totalComments}</span>
      </button>
      <button
        class="px-2 my-2"
        on:click={() => markLessonComplete(data.lessonId)}
        disabled={isMarkingComplete}
      >
        {#if isLessonComplete}
          <CheckmarkFilledIcon size={24} class="carbon-icon text-primary-600" />
        {:else}
          <CheckmarkOutlineIcon size={24} class="carbon-icon" />
        {/if}
      </button>
    </div>
  </div>
</CourseContainer>

<style>
  @media screen and (min-width: 1023px) {
    .tab {
      display: none;
    }
  }
</style>
