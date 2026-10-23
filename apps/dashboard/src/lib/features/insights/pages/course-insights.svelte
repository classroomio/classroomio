<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import * as Page from '@cio/ui/base/page';
  import { RefreshPageData } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';

  import { insightsApi, insightsLearnersApi } from '../api';
  import InsightsDashboard from '../components/insights-dashboard.svelte';
  import UpdatedAgo from '../components/updated-ago.svelte';
  import { InsightsPoller } from '../utils/insights-poller';

  interface Props {
    courseId: string;
  }

  let { courseId }: Props = $props();

  let loadedKey = '';

  const scope = $derived({ type: 'course' as const, id: courseId });

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId) return;

    const key = `${organizationId}:${courseId}`;
    if (key === loadedKey) return;

    loadedKey = key;
    untrack(() => {
      insightsLearnersApi.reset();
      void insightsApi.loadDashboard(scope).then(() => insightsLearnersApi.load());
    });
  });

  $effect(() => {
    const intervalSeconds = insightsApi.dashboard?.refreshIntervalSeconds;
    if (!intervalSeconds) return;

    const poller = new InsightsPoller(intervalSeconds * 1000, () => {
      void insightsApi.poll();
      void insightsLearnersApi.refreshVisible();
    });
    poller.start();

    return () => poller.stop();
  });

  onDestroy(() => {
    insightsApi.reset();
    insightsLearnersApi.reset();
  });

  async function handleRefresh() {
    await Promise.all([insightsApi.refreshAll(), insightsLearnersApi.refreshVisible()]);
  }
</script>

<svelte:head>
  <title>{$t('insights.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-6xl px-4">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('insights.title')}</Page.Title>
      <p class="ui:text-muted-foreground text-sm">
        {$t('insights.subtitle.course', { count: insightsApi.dashboard?.scope.learnerCount ?? 0 })}
      </p>
    </Page.HeaderContent>
    <Page.Action>
      <UpdatedAgo generatedAt={insightsApi.generatedAt} />
      <RefreshPageData disabled={!insightsApi.dashboard} onRefresh={handleRefresh} />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <InsightsDashboard {scope} />
    {/snippet}
  </Page.Body>
</Page.Root>
