<script context="module">
  export async function preload({ params }, session) {
    return { courseId: params.id };
  }
</script>

<script>
  import Overview from '../../../components/Course/index.svelte';
  import CourseContainer from '../../../components/CourseContainer/index.svelte';
  import { setCourse } from '../../../components/Course/store';
  import { fetchCourse } from '../../../utils/services/courses';

  export let courseId;

  let prevCourseId;

  async function onCourseIdChange(courseId) {
    if (!courseId || prevCourseId === courseId) return;

    const { data } = await fetchCourse(courseId);

    setCourse(data);
    prevCourseId = courseId;
  }

  $: onCourseIdChange(courseId);
</script>

<CourseContainer>
  <Overview />
</CourseContainer>
