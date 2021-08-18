<script context="module">
  import { fetchCourse } from '../../../utils/services/courses';

  export async function preload({ params }, session) {
    const {
      data,
      // error
    } = await fetchCourse(params.id, session);

    return { courseData: data };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import Overview from '../../../components/Course/index.svelte';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  import { setCourseData } from '../../../components/Course/store';

  export let courseData;

  onMount(async () => {
    setCourseData(courseData);
  });
</script>

<CourseContainer>
  <Overview />
</CourseContainer>
