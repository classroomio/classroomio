<script lang="ts">
  import CourseLandingPage from '$lib/components/CourseLandingPage/index.svelte';
  import type { Course } from '$lib/utils/types';

  interface Data {
    course: Course;
  }

  interface Props {
    data: Data;
  }

  let { data }: Props = $props();
</script>

<CourseLandingPage courseData={data.course} />
