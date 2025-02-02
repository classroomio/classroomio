<script>
  import { CourseContainer } from '$lib/components/Course';
  import { CourseSettings } from '$lib/components/Course/components/Settings';
  import CreateTagModal from '$lib/components/CourseTags/CreateTagModal.svelte';
  import { PageBody, PageNav } from '$lib/components/Page';
  import { t } from '$lib/utils/functions/translations';

  export let data;
</script>

<CourseContainer bind:courseId={data.courseId}>
  <PageNav title={$t('course.navItem.settings.heading')} />
  <PageBody>
    <CreateTagModal />
    <CourseSettings />
  </PageBody>
</CourseContainer>
