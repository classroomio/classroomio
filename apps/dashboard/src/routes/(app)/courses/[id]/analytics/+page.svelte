<script lang="ts">
  import { AnalyticsPage } from '$features/course/pages';
  import { RefreshPageData } from '$features/ui';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();
</script>

<Page.Root class="max-auto w-[90%] px-4">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t('analytics.title')}
      </Page.Title>
      <p class="ui:text-muted-foreground text-sm">{$t('analytics.course_metrics.page_subtitle')}</p>
    </Page.HeaderContent>
    <Page.Action>
      <RefreshPageData />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <AnalyticsPage courseAnalytics={data.courseAnalytics} />
    {/snippet}
  </Page.Body>
</Page.Root>
