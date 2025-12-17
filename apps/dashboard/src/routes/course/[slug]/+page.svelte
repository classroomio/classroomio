<script lang="ts">
  import { CourseLandingPage } from '$features/ui';
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
