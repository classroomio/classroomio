<script context="module">
  export async function preload({ params }) {
    return { slug: params.slug };
  }
</script>

<script>
  import Backdrop from '../../components/Backdrop/index.svelte';
  import { Moon } from 'svelte-loading-spinners';
  import CourseLandingPage from '../../components/CourseLandingPage/index.svelte';
  import { profile } from '../../utils/store/user';
  import { setCourse, course } from '../../components/Course/store';
  import { lessons } from '../../components/Course/components/Lesson/store/lessons';
  import { fetchCourse } from '../../utils/services/courses';

  export let slug;

  let courseData = {};
  let loading = false;

  async function triggerSetCourse(_profile) {
    loading = true;
    const { data } = await fetchCourse(undefined, slug);
    setCourse(data);
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
