<script lang="ts">
  import { page } from '$app/stores';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import { fetchCourse, fetchLesson, updateLessonCompletion } from '$lib/utils/services/courses';
  import CheckmarkOutlineIcon from 'carbon-icons-svelte/lib/CheckmarkOutline.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { Loading } from 'carbon-components-svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import Materials from '$lib/components/Course/components/Lesson/Materials/index.svelte';
  import Exercises from '$lib/components/Course/components/Lesson/Exercises/index.svelte';
  import MODES from '$lib/utils/constants/mode';
  import { setCourse, course } from '$lib/components/Course/store';
  import Download from 'carbon-icons-svelte/lib/Download.svelte';
  import OverflowMenuVertical from 'carbon-icons-svelte/lib/OverflowMenuVertical.svelte';
  import { apps } from '$lib/components/Apps/store';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import {
    lesson,
    lessons,
    handleSaveLesson
  } from '$lib/components/Course/components/Lesson/store/lessons';
  import { browser } from '$app/environment';
  import { currentOrg } from '$lib/utils/store/org';
  import { snackbar } from '$lib/components/Snackbar/store';
  import type { LessonCompletion, LessonPage } from '$lib/utils/types';
  import { profile } from '$lib/utils/store/user.js';
  import { getIsLessonComplete } from '$lib/components/Course/components/Lesson/functions';

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

  function getLessonOrder(id: string) {
    const index = $lessons.findIndex((lesson) => lesson.id === id);

    if (index < 10) {
      return '0' + (index + 1);
    } else {
      return index + 1;
    }
  }

  async function fetchReqData(lessonId = '', isMaterialsTabActive: false) {
    isFetching = true;

    let lessonData;
    if (!$course.id) {
      const { data: _data } = await fetchCourse(data.courseId);

      lessonData = _data?.lessons.find((lesson) => lesson.id === lessonId);

      setCourse(_data);
    } else if (isMaterialsTabActive) {
      const lesson = await fetchLesson(lessonId);
      lessonData = lesson.data;
    }

    console.log('lessonData', lessonData);
    prevLessonId = lessonId;

    const totalExercises = lessonData?.totalExercises?.[0] && lessonData.totalExercises[0].count;
    setLesson(lessonData, totalExercises || 0);
    isFetching = false;
  }

  async function markLessonComplete() {
    let found = false;
    isMarkingComplete = true;

    let completion: LessonCompletion = {
      is_complete: true,
      profile_id: $profile.id || '',
      lesson_id: $lesson.id || '',
      created_at: new Date().toDateString(),
      updated_at: new Date().toDateString()
    };
    const completions: LessonCompletion[] = $lesson.lesson_completion.map((_completion) => {
      if (_completion.profile_id === $profile.id) {
        found = true;
        _completion.is_complete = !_completion.is_complete;

        completion = _completion;
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

      const response = await fetch('https://classroomio-server.fly.dev/downloadLesson', {
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

      snackbar.success('Download Complete');
    } catch (error) {
      console.log('error downloading lesson', error);
      snackbar.error("Something's not right - Please try later");
    }

    isLoading = false;
  };

  function setLesson(lessonData, totalExercises) {
    if (!lessonData) return;

    let lesson_completion: LessonCompletion[] = [];

    if (Array.isArray(lessonData.lesson_completion)) {
      lesson_completion = [...lessonData.lesson_completion];
    }

    lesson.update((l) => ({
      ...l,
      id: data.lessonId,
      totalExercises,
      materials: lessonData,
      lesson_completion
    }));
  }

  const toggleApps = () => {
    $apps.open = !$apps.open;
  };

  function toggleMode() {
    prevMode = mode;
    mode = mode === MODES.edit ? MODES.view : MODES.edit;
  }

  $: path = $page.url?.pathname?.replace(/\/exercises[\/ 0-9 a-z -]*/, '');

  $: if (data.courseId && browser) {
    mode = MODES.view;
    fetchReqData(data.lessonId, data.isMaterialsTabActive);
  }
</script>

<CourseContainer
  bind:isStudent
  {path}
  isExercisePage={!data.isMaterialsTabActive && data.exerciseId}
>
  <PageNav
    navItems={[
      {
        label: 'Materials',
        isActive: data.isMaterialsTabActive,
        href: path
      },
      {
        label: 'Exercises',
        badgeValue: $lesson.totalExercises,
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
            {#if $course.metadata.lessonDownload}
              <PrimaryButton
                className="mb-2 lg:mb-0 mr-2"
                variant={VARIANTS.OUTLINED}
                onClick={downloadLesson}
                {isLoading}
              >
                <Download size={16} class="mr-2" />
                Download PDF
              </PrimaryButton>
            {/if}

            <PrimaryButton className="mr-2" variant={VARIANTS.OUTLINED} onClick={toggleMode}>
              {#if isSaving}
                <Loading withOverlay={false} small />
                <span class="text-sm ml-2 italic">Autosaving...</span>
              {:else}
                {mode === MODES.edit ? 'Done' : 'Edit'}
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
      onClick={() => {
        $apps.open = false;
        $apps.dropdown = false;
      }}
      width="lg:w-full xl:w-11/12"
    >
      <Materials lessonId={data.lessonId} {mode} {prevMode} {toggleMode} bind:isSaving />

      <div class="w-full flex flex-row-reverse mt-10">
        <PrimaryButton
          onClick={markLessonComplete}
          isLoading={isMarkingComplete}
          isDisabled={isMarkingComplete}
          variant={VARIANTS.OUTLINED}
          className="mt-10"
        >
          <CheckmarkOutlineIcon size={24} class="carbon-icon mr-2" />
          Mark as {getIsLessonComplete($lesson.lesson_completion, $profile.id)
            ? 'Incomplete'
            : 'Complete'}
        </PrimaryButton>
      </div>
    </PageBody>
  {/if}
</CourseContainer>

<style>
  @media screen and (min-width: 1023px) {
    .tab {
      display: none;
    }
  }
</style>
