<script lang="ts">
  import get from 'lodash/get';
  import CourseLandingPage from '$lib/components/CourseLandingPage/index.svelte';
  import type { Course } from '$lib/utils/types';

  interface Data {
    course: Course;
  }

  export let data: Data;

  let courseData: Course;

  function setCourseData(course: Course | null) {
    if (!course) return;

    courseData = { ...course };
  }

  $: setCourseData(data.course);
</script>

<svelte:head>
  <title>{get(data.course, 'title', '')}</title>
  <meta name="description" content={get(data.course, 'description', '')} />
  <meta name="theme-color" content="#ffffff" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta property="og:title" content={get(data.course, 'title', '')} />
  <meta property="og:description" content={get(data.course, 'description', '')} />

  <meta property="og:type" content="website" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="280" />
  <meta property="og:image:height" content="200" />
  <meta property="og:image:secure_url" content={get(data.course, 'logo', '')} />

  <meta property="og:type" content="website" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1920" />
  <meta property="og:image:height" content="1080" />
  <meta property="og:image:secure_url" itemprop="image" content={get(data.course, 'logo', '')} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta property="twitter:domain" content="classroomio.com" />
  <meta property="twitter:url" content="https://www.classroomio.com/" />
  <meta name="twitter:title" content={get(data.course, 'title', '')} />
  <meta name="twitter:description" content={get(data.course, 'description', '')} />
  <meta name="twitter:image" content={get(data.course, 'logo', '')} />
</svelte:head>

<CourseLandingPage {courseData} />
