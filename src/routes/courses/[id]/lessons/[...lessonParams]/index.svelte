<script context="module">
  import {
    fetchCourse,
    fetchLesson,
  } from '../../../../../utils/services/courses';

  export async function preload({ params }) {
    const { id: courseId, lessonParams = [] } = params;
    const [lessonId, exerciseRouteName, exerciseId] = lessonParams;

    return {
      courseId,
      lessonId,
      exerciseRouteName,
      exerciseId,
      isMaterialsTabActive: !exerciseRouteName,
    };
  }
</script>

<script>
  import { stores } from '@sapper/app';
  import CourseContainer from '../../../../../components/CourseContainer/index.svelte';

  import PrimaryButton from '../../../../../components/PrimaryButton/index.svelte';
  import RoleBasedSecurity from '../../../../../components/RoleBasedSecurity/index.svelte';
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

  export let courseId;
  export let lessonId;
  export let exerciseId;
  export let isMaterialsTabActive;

  let path;
  let mode = MODES.view;
  let prevMode;
  let prevLessonId;
  let isFetching = false;

  const { page } = stores();

  async function fetchReqData(lessonId) {
    isFetching = true;

    let lessonData;
    if (!$course.id) {
      const [_course, lesson] = await Promise.all([
        fetchCourse(courseId),
        fetchLesson(lessonId),
      ]);

      lessonData = lesson.data;

      setCourseData(_course.data);
    } else if (prevLessonId !== lessonId) {
      const lesson = await fetchLesson(lessonId);
      lessonData = lesson.data;
    }

    prevLessonId = lessonId;

    const totalExercises =
      lessonData.totalExercises[0] && lessonData.totalExercises[0].count;
    setLesson(lessonData, totalExercises);
    isFetching = false;
  }

  function setLesson(lessonData, totalExercises) {
    if (!lessonData) return;

    lesson.update((l) => ({
      ...l,
      id: lessonId,
      totalExercises,
      materials: lessonData,
    }));
  }

  $: path = $page.path.replace(/\/exercises[\/ 0-9 a-z -]*/, '');

  $: {
    if (courseId) {
      mode = MODES.view;
      fetchReqData(lessonId);
    }
  }
</script>

<CourseContainer
  {isFetching}
  {path}
  isExercisePage={!isMaterialsTabActive && exerciseId}
>
  <PageNav
    navItems={[
      {
        label: 'Materials',
        isActive: isMaterialsTabActive,
        href: path,
      },
      {
        label: 'Exercises',
        badgeValue: $lesson.totalExercises,
        isActive: !isMaterialsTabActive,
        href: `${path}/exercises`,
      },
    ]}
  >
    <svelte:fragment slot="widget">
      <RoleBasedSecurity allowedRoles="[1,2]">
        {#if isMaterialsTabActive}
          <div class="flex items-center">
            <PrimaryButton
              className="mr-2"
              label={mode === MODES.edit ? 'Save' : 'Edit'}
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

  {#if !isMaterialsTabActive}
    <Exercises {lessonId} {exerciseId} path={`${path}/exercises`} />
  {:else if !!lessonId}
    <PageBody>
      <Materials {lessonId} {mode} {prevMode} />
    </PageBody>
  {/if}
</CourseContainer>
