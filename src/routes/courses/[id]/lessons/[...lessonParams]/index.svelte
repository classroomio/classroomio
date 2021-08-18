<script context="module">
  import {
    fetchCourse,
    fetchLesson,
  } from '../../../../../utils/services/courses';
  let prevLessonId;

  export async function preload({ params }, session) {
    const { id: courseId, lessonParams = [] } = params;
    const [lessonId, exerciseRouteName, exerciseId] = lessonParams;
    let courseData;
    let lessonData;

    if (!process.browser) {
      const [course, lesson] = await Promise.all([
        fetchCourse(courseId, session),
        fetchLesson(lessonId),
      ]);

      courseData = course.data;
      lessonData = lesson.data;
    } else if (prevLessonId && prevLessonId !== lessonId) {
      const lesson = await fetchLesson(lessonId);

      lessonData = lesson.data;
    }

    prevLessonId = lessonId;
    return {
      courseData,
      lessonData,
      isMaterialsTabActive: !exerciseRouteName,
      lessonId,
      exerciseId,
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
  import { setCourseData } from '../../../../../components/Course/store';
  import { lesson } from '../../../../../components/Course/components/Lesson/store/lessons';

  export let courseData;
  export let lessonData;
  export let lessonId;
  export let exerciseId;
  export let isMaterialsTabActive;

  let path;
  let mode = MODES.view;

  const { page } = stores();

  function setLesson() {
    if (!lessonData) return;

    lesson.update((l) => ({
      ...l,
      id: lessonId,
      materials: lessonData,
    }));
  }

  onMount(() => {
    setCourseData(courseData);

    setLesson();
  });

  afterUpdate(setLesson);

  $: path = $page.path.replace(/\/exercises[\/ 0-9 a-z -]*/, '');
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
  {:else}
    <PageBody width="w-11/12 m-auto">
      <Materials {lessonId} {mode} />
    </PageBody>
  {/if}
</CourseContainer>
