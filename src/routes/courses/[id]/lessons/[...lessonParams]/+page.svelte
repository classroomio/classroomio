<script>
  import { page } from '$app/stores';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import { fetchCourse, fetchLesson } from '$lib/utils/services/courses';
  import CheckmarkOutlineIcon from 'carbon-icons-svelte/lib/CheckmarkOutline.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants.js';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import Materials from '$lib/components/Course/components/Lesson/Materials/index.svelte';
  import Exercises from '$lib/components/Course/components/Lesson/Exercises/index.svelte';
  import MODES from '$lib/utils/constants/mode.js';
  import { setCourse, course } from '$lib/components/Course/store';
  import { lesson, handleSaveLesson } from '$lib/components/Course/components/Lesson/store/lessons';

  export let data;

  let path = '';
  let mode = MODES.view;
  let prevMode = '';
  let prevLessonId = '';
  let isFetching = false;
  let isMarkingComplete = false;

  async function fetchReqData(lessonId = '') {
    isFetching = true;

    let lessonData;
    if (!$course.id) {
      const { data: _data } = await fetchCourse(data.courseId);

      lessonData = _data.lessons.find((lesson = { id: '' }) => lesson.id === lessonId);
      setCourse(_data);
    } else if (prevLessonId !== lessonId) {
      const lesson = await fetchLesson(lessonId);
      lessonData = lesson.data;
    }

    prevLessonId = lessonId;

    const totalExercises = lessonData?.totalExercises?.[0] && lessonData.totalExercises[0].count;
    setLesson(lessonData, totalExercises || 0);
    isFetching = false;
  }

  async function markLessonComplete() {
    isMarkingComplete = true;
    $lesson.is_complete = !$lesson.is_complete;
    await handleSaveLesson($lesson, $course.id);
    isMarkingComplete = false;
  }

  function setLesson(lessonData, totalExercises) {
    if (!lessonData) return;

    lesson.update((l) => ({
      ...l,
      id: data.lessonId,
      totalExercises,
      materials: lessonData
    }));
  }

  $: path = $page.url.pathname.replace(/\/exercises[\/ 0-9 a-z -]*/, '');

  $: if (data.courseId) {
    mode = MODES.view;
    fetchReqData(data.lessonId);
  }
</script>

<CourseContainer {isFetching} {path} isExercisePage={!data.isMaterialsTabActive && data.exerciseId}>
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
          <div class="flex items-center">
            <PrimaryButton
              className="mr-2"
              label={mode === MODES.edit ? 'Save' : 'Edit'}
              variant={VARIANTS.CONTAINED_INFO}
              onClick={() => {
                prevMode = mode;
                mode = mode === MODES.edit ? MODES.view : MODES.edit;
              }}
            />
          </div>
        {/if}
      </RoleBasedSecurity>
    </svelte:fragment>
  </PageNav>

  {#if !data.isMaterialsTabActive}
    <Exercises lessonId={data.lessonId} exerciseId={data.exerciseId} path={`${path}/exercises`} />
  {:else if !!data.lessonId}
    <PageBody>
      <Materials lessonId={data.lessonId} {mode} {prevMode} />

      <div class="w-full flex flex-row-reverse">
        <PrimaryButton
          onClick={markLessonComplete}
          isLoading={isMarkingComplete}
          isDisabled={isMarkingComplete}
          variant={VARIANTS.OUTLINED}
          className="mt-10"
        >
          <CheckmarkOutlineIcon size={24} class="carbon-icon mr-2" />
          Mark as {$lesson.is_complete ? 'Incomplete' : 'Complete'}
        </PrimaryButton>
      </div>
    </PageBody>
  {/if}
</CourseContainer>
