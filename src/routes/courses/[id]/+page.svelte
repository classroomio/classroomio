<script>
  import Overview from '$lib/components/Course/index.svelte';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';

  export let data;
</script>

<CourseContainer bind:courseId={data.courseId}>
  <Overview />
</CourseContainer>
