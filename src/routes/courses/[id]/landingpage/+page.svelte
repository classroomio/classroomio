<script>
  import { fly } from 'svelte/transition';
  import CourseLandingPage from '$lib/components/CourseLandingPage/index.svelte';
  import Editor from '$lib/components/CourseLandingPage/components/Editor/index.svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { profile } from '$lib/utils/store/user';
  import { setCourse, course } from '$lib/components/Course/store';
  import { lessons } from '$lib/components/Course/components/Lesson/store/lessons';
  import { fetchCourse } from '$lib/utils/services/courses';
  import { browser } from '$app/environment';

  export let data;
  const { courseId } = data;

  let courseData = {};

  async function triggerSetCourse(_profile) {
    if ($course.id || !browser) return;
    const { data: _data } = await fetchCourse(courseId);
    setCourse(_data);
  }

  function setCourseData(course = {}, lessons) {
    courseData = { ...course, lessons };
  }

  $: triggerSetCourse($profile);
  $: setCourseData($course, $lessons);
  $: console.log('courseData changed', courseData);
</script>

<div
  class="root absolute inset-0 flex justify-center items-center z-50 bg-white"
  in:fly={{ y: 500, duration: 500 }}
  out:fly={{ y: 500, duration: 500 }}
>
  <Editor {courseId} bind:course={courseData} />
  <div class="rightBar" class:isMobile={$isMobile}>
    <CourseLandingPage bind:courseData />
  </div>
</div>

<style>
  .rightBar {
    flex-grow: 1;
    width: calc(100% - 360px);
    overflow: auto;
    height: 100%;
    overflow: auto;
  }

  .rightBar.isMobile {
    margin-left: 10px;
  }
</style>
