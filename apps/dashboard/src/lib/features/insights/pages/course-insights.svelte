<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import * as Page from '@cio/ui/base/page';
  import { RefreshPageData } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';

  import { insightsApi, insightsStudentsApi } from '../api';
  import InsightsDashboard from '../components/insights-dashboard.svelte';
  import InsightsRangePicker from '../components/insights-range-picker.svelte';
  import InsightsLiveIndicator from '../components/insights-live-indicator.svelte';
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
      insightsStudentsApi.reset();
      void insightsApi.loadDashboard(scope).then(() => insightsStudentsApi.load());
    });
  });

  $effect(() => {
    const intervalSeconds = insightsApi.dashboard?.refreshIntervalSeconds;
    if (!intervalSeconds) return;

    const poller = new InsightsPoller(intervalSeconds * 1000, () => void refreshPage());
    poller.start();

    return () => poller.stop();
  });

  onDestroy(() => {
    insightsApi.reset();
    insightsStudentsApi.reset();
  });

  async function refreshPage(options: { refresh?: boolean } = {}) {
    await (options.refresh ? insightsApi.refreshAll() : insightsApi.poll());
    await insightsStudentsApi.refreshVisible(options);
  }

  async function handleRefresh() {
    await refreshPage({ refresh: true });
  }
</script>

<svelte:head>
  <title>{$t('insights.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-6xl px-4">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title class="inline-flex items-center gap-2.5">
        <span>{$t('insights.title')}</span>
        <InsightsLiveIndicator />
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <InsightsRangePicker />
      <RefreshPageData disabled={!insightsApi.dashboard} onRefresh={handleRefresh} />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <InsightsDashboard {scope} />
    {/snippet}
  </Page.Body>
</Page.Root>
