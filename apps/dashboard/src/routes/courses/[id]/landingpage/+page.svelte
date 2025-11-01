<script lang="ts">
  import { fly } from 'svelte/transition';
  import { course } from '$lib/components/Course/store';
  import type { Course } from '$lib/utils/types';
  import { lessons, lessonSections } from '$lib/components/Course/components/Lesson/store/lessons';
  import { CourseContainer } from '$lib/components/CourseContainer';

  import CourseLandingPage from '$lib/components/CourseLandingPage/index.svelte';
  import Editor from '$lib/components/CourseLandingPage/components/Editor/index.svelte';

  let { data } = $props();

  const { courseId } = data;

  let courseData: Course = $derived({
    ...$course,
    $lessons,
    $lessonSections
  });

  function syncCourseStore(_courseData: Course) {
    $course = _courseData;
  }
</script>

<CourseContainer {courseId} renderOnlyChildren={true}>
  <div
    class="absolute inset-0 z-50 flex bg-white"
    in:fly={{ y: 500, duration: 500 }}
    out:fly={{ y: 500, duration: 500 }}
  >
    <Editor {courseId} bind:course={courseData} {syncCourseStore} />
    <div class="rightBar">
      <CourseLandingPage bind:courseData editMode={true} />
    </div>
  </div>
</CourseContainer>

<style>
  .rightBar {
    flex-grow: 1;
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }
</style>
