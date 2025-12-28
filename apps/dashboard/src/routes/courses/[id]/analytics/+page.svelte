<script lang="ts">
  import { AnalyticsPage } from '$features/course/pages';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();
</script>

<svelte:head>
  <title>Analytics - ClassroomIO</title>
</svelte:head>


  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('analytics.title')}
      </Page.Title>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <AnalyticsPage courseId={data.courseId} />
    {/snippet}
  </Page.Body>

