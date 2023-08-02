<script>
  import Overview from '$lib/components/Course/index.svelte';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import { setCourse } from '$lib/components/Course/store';
  import { fetchCourse } from '$lib/utils/services/courses';

  export let data;
  const { courseId } = data;

  let prevCourseId = '';

  async function onCourseIdChange(courseId = '') {
    if (!courseId || prevCourseId === courseId) return;

    const { data: _data } = await fetchCourse(courseId);

    setCourse(_data);
    prevCourseId = courseId;
  }

  $: onCourseIdChange(courseId);
</script>

<CourseContainer>
  <Overview />
</CourseContainer>
