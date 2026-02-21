<script lang="ts">
  import { AnalyticsPage } from '$features/course/pages';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();
</script>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>
      {$t('analytics.title')}
    </Page.Title>
  </Page.HeaderContent>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <AnalyticsPage courseId={data.courseId} courseAnalytics={data.courseAnalytics} />
  {/snippet}
</Page.Body>
