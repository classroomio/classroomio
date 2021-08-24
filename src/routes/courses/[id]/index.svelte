<script context="module">
  export async function preload({ params }, session) {
    return { courseId: params.id };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import Overview from '../../../components/Course/index.svelte';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  import { setCourseData, course } from '../../../components/Course/store';
  import { fetchCourse } from '../../../utils/services/courses';

  export let courseId;

  onMount(async () => {
    console.log(`overview courseId`, courseId);
    if ($course.id) return;

    const { data } = await fetchCourse(courseId);
    setCourseData(data);
  });
</script>

<CourseContainer>
  <Overview />
</CourseContainer>
