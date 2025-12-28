<script lang="ts">
  import { fly } from 'svelte/transition';
  import { course } from '$features/course/store';
  import type { Course } from '$lib/utils/types';
  import { lessons, lessonSections } from '$features/course/components/lesson/store/lessons';

  import { CourseLandingPage } from '$features/ui';
  import Editor from '$features/ui/course-landing-page/components/editor/editor.svelte';

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
