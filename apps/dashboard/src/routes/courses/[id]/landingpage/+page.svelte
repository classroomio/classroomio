<script lang="ts">
  import { dev } from '$app/environment';
  import { CourseLandingPage, Editor } from '$lib/components/Course/components/LandingPage';
  import { lessons, lessonSections } from '$lib/components/Course/components/Lesson/store/lessons';
  import { course } from '$lib/components/Course/store';
  import type { Course, Lesson, LessonSection } from '$lib/utils/types';
  import { fly } from 'svelte/transition';

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
  class="absolute inset-0 z-50 flex bg-white"
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
