<script lang="ts">
  import { AnalyticsPage } from '$features/course/pages';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();
</script>

<Page.Root class="mx-auto flex w-[90%] px-4 md:max-w-2xl lg:max-w-3xl">
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
</Page.Root>
