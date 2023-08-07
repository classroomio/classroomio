<script>
  import Backdrop from '$lib/components/Backdrop/index.svelte';
  import { Moon } from 'svelte-loading-spinners';
  import CourseLandingPage from '$lib/components/CourseLandingPage/index.svelte';
  import { profile } from '$lib/utils/store/user';
  import { setCourse, course } from '$lib/components/Course/store';
  import { lessons } from '$lib/components/Course/components/Lesson/store/lessons';
  import { fetchCourse } from '$lib/utils/services/courses';
  import { browser } from '$app/environment';

  export let data;

  let courseData = {};
  let loading = false;

  async function triggerSetCourse(_profile) {
    if (!browser) return;
    loading = true;
    const { data: _data } = await fetchCourse(undefined, data.slug);
    setCourse(_data);
    loading = false;
  }

  function setCourseData(course, lessons) {
    courseData = { ...course, lessons };
    console.log('courseData', courseData);
  }

  $: triggerSetCourse($profile);
  $: setCourseData($course, $lessons);
</script>

{#if loading}
  <Backdrop>
    <Moon size="60" color="#1d4ed8" unit="px" duration="1s" />
  </Backdrop>
{:else}
  <CourseLandingPage {courseData} />
{/if}
