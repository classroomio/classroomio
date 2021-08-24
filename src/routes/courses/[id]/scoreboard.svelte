<script context="module">
  import { fetchCourse } from '../../../utils/services/courses';

  export async function preload({ params }, session) {
    if (process.browser) {
      return {};
    }

    const {
      data,
      // error
    } = await fetchCourse(params.id, session);

    return { courseData: data };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  import PageNav from '../../../components/PageNav/index.svelte';
  import PageBody from '../../../components/PageBody/index.svelte';
  import { setCourseData } from '../../../components/Course/store';

  export let courseData = {};

  onMount(() => {
    setCourseData(courseData);
  });
</script>

<CourseContainer>
  <PageNav title="Scoreboard" />
  <PageBody />
</CourseContainer>
