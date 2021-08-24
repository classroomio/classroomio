<script context="module">
  import {
    fetchCourse,
    fetchLesson,
  } from '../../../../../utils/services/courses';

  export async function preload({ params }, session) {
    return {
      params,
    };
  }
</script>

<script>
  import { onMount, afterUpdate } from 'svelte';
  import { stores } from '@sapper/app';
  import CourseContainer from '../../../../../components/CourseContainer/index.svelte';

  import PrimaryButton from '../../../../../components/PrimaryButton/index.svelte';
  import PageNav from '../../../../../components/PageNav/index.svelte';
  import PageBody from '../../../../../components/PageBody/index.svelte';
  import Materials from '../../../../../components/Course/components/Lesson/Materials/index.svelte';
  import Exercises from '../../../../../components/Course/components/Lesson/Exercises/index.svelte';
  import MODES from '../../../../../utils/constants/mode.js';
  import {
    setCourseData,
    course,
  } from '../../../../../components/Course/store';
  import { lesson } from '../../../../../components/Course/components/Lesson/store/lessons';

  export let params;
  export let lessonId;
  export let exerciseId;
  export let isMaterialsTabActive;

  let path;
  let mode = MODES.view;
  let prevLessonId;

  const { page } = stores();

  async function fetchReqData() {
    const { id: courseId, lessonParams = [] } = params;
    const [_lessonId, exerciseRouteName, _exerciseId] = lessonParams;

    let courseData;
    let lessonData;

    if (!$course.id) {
      const [_course, lesson] = await Promise.all([
        fetchCourse(courseId),
        fetchLesson(_lessonId),
      ]);

      courseData = _course.data;
      lessonData = lesson.data;
    } else if (prevLessonId && prevLessonId !== _lessonId) {
      const lesson = await fetchLesson(_lessonId);

      lessonData = lesson.data;
    }

    prevLessonId = _lessonId;
    lessonId = _lessonId;
    exerciseId = _exerciseId;
    isMaterialsTabActive = !exerciseRouteName;

    setCourseData(courseData);
    setLesson(lessonData);
  }

  function setLesson(lessonData) {
    if (!lessonData) return;

    lesson.update((l) => ({
      ...l,
      id: lessonId,
      materials: lessonData,
    }));
  }

  $: path = $page.path.replace(/\/exercises[\/ 0-9 a-z -]*/, '');

  $: {
    console.log(`params`, params);
    if (params) {
      mode = MODES.view;
      fetchReqData();
    }
  }
</script>

<CourseContainer {path} isExercisePage={!isMaterialsTabActive && exerciseId}>
  <PageNav
    navItems={[
      {
        label: 'Materials',
        isActive: isMaterialsTabActive,
        href: path,
      },
      {
        label: 'Exercises',
        isActive: !isMaterialsTabActive,
        href: `${path}/exercises`,
      },
    ]}
  >
    <svelte:fragment slot="widget">
      {#if isMaterialsTabActive}
        <div class="flex items-center">
          <PrimaryButton
            className="mr-2"
            label={mode === MODES.edit ? 'Save' : 'Edit'}
            onClick={() =>
              (mode = mode === MODES.edit ? MODES.view : MODES.edit)}
          />
        </div>
      {/if}
    </svelte:fragment>
  </PageNav>

  {#if !isMaterialsTabActive}
    <Exercises {lessonId} {exerciseId} path={`${path}/exercises`} />
  {:else if !!lessonId}
    <PageBody>
      <Materials {lessonId} {mode} />
    </PageBody>
  {/if}
</CourseContainer>
