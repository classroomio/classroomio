<script>
  import { fly } from 'svelte/transition';
  import CourseLandingPage from '$lib/components/CourseLandingPage/index.svelte';
  import Editor from '$lib/components/CourseLandingPage/components/Editor/index.svelte';
  import { course } from '$lib/components/Course/store';
  import { lessons } from '$lib/components/Course/components/Lesson/store/lessons';

  export let data;

  const { courseId } = data;

  let courseData = {};

  function setCourseData(course = {}, lessons) {
    courseData = { ...course, lessons };
  }

  $: setCourseData($course, $lessons);
  $: console.log('courseData changed', courseData);
</script>

<div
  class="absolute flex inset-0 z-50 bg-white"
  in:fly={{ y: 500, duration: 500 }}
  out:fly={{ y: 500, duration: 500 }}
>
  <Editor {courseId} bind:course={courseData} />
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
