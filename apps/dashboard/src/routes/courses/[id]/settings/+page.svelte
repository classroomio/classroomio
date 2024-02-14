<script>
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import Settings from '$lib/components/Course/components/Settings/index.svelte';

  export let data;
</script>

<CourseContainer bind:courseId={data.courseId}>
  <PageNav title="Settings" />
  <PageBody>
    <Settings />
  </PageBody>
</CourseContainer>
