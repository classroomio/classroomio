<script context="module">
  export async function preload({ params }, session) {
    return { courseId: params.id };
  }
</script>

<script>
  import Overview from '../../../components/Course/index.svelte';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  import { setCourseData } from '../../../components/Course/store';
  import { fetchCourse } from '../../../utils/services/courses';

  export let courseId;

  async function onCourseIdChange(courseId) {
    if (!courseId) return;
    console.log(`overview courseId`, courseId);

    const { data } = await fetchCourse(courseId);

    setCourseData(data);
  }

  $: onCourseIdChange(courseId);
</script>

<CourseContainer>
  <Overview />
</CourseContainer>
