<script lang="ts">
  import Settings from '$lib/components/Course/components/Settings/index.svelte';
  import { PageBody, PageNav } from '$lib/components/Page';
  import { t } from '$lib/utils/functions/translations';
  import { CourseContainer } from '$lib/components/CourseContainer';

  let { data } = $props();
</script>

<CourseContainer courseId={data.courseId}>
  <PageNav title={$t('course.navItem.settings.heading')} />
  <PageBody>
    <Settings />
  </PageBody>
</CourseContainer>
