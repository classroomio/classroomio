<script lang="ts">
  import { dev } from '$app/environment';
  import { fly } from 'svelte/transition';
  import { course } from '$lib/components/Course/store';
  import type { Course, Lesson, LessonSection } from '$lib/utils/types';
  import { lessons, lessonSections } from '$lib/components/Course/components/Lesson/store/lessons';

  import CourseLandingPage from '$lib/components/CourseLandingPage/index.svelte';
  import Editor from '$lib/components/CourseLandingPage/components/Editor/index.svelte';

  export let data;

  const { courseId } = data;

  let courseData: Course = $course;

  function setCourseData(course: Course, lessons: Lesson[], lesson_section: LessonSection[]) {
    courseData = { ...course, lessons, lesson_section };
  }

  function syncCourseStore(_courseData: Course) {
    $course = _courseData;
  }

  $: setCourseData($course, $lessons, $lessonSections);
  $: dev && console.log('courseData changed', courseData);
</script>

<div
  class="absolute flex inset-0 z-50 bg-white"
  in:fly={{ y: 500, duration: 500 }}
  out:fly={{ y: 500, duration: 500 }}
>
  <Editor {courseId} bind:course={courseData} {syncCourseStore} />
  <div class="rightBar">
    <CourseLandingPage bind:courseData editMode={true} />
  </div>
</div>

<style>
  .rightBar {
    flex-grow: 1;
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }
</style>
