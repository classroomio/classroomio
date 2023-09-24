<script>
  import { course, setCourse } from '$lib/components/Course/store';
  import { fetchCourse } from '$lib/utils/services/courses';
  import { onMount } from 'svelte';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import Settings from '$lib/components/Course/components/Settings/index.svelte';

  export let data;

  const { courseId } = data;
  let isStudent = false;

  onMount(async () => {
    if ($course.id) return;
    const { data } = await fetchCourse(courseId);
    setCourse(data);
  });
</script>

<CourseContainer bind:isStudent>
  <PageNav title="Settings" />
  <PageBody>
    <Settings />
  </PageBody>
</CourseContainer>
