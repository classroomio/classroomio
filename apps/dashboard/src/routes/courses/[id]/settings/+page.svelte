<script>
  import Settings from '$lib/components/Course/components/Settings/index.svelte';
  import CourseContainer from '$lib/components/CourseContainer/index.svelte';
  import { PageBody, PageNav } from '$lib/components/Page';
  import { t } from '$lib/utils/functions/translations';

  export let data;
</script>

<CourseContainer bind:courseId={data.courseId}>
  <PageNav title={$t('course.navItem.settings.heading')} />
  <PageBody>
    <Settings />
  </PageBody>
</CourseContainer>
