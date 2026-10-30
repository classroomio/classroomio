<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import LockIcon from '@lucide/svelte/icons/lock';
  import * as Page from '@cio/ui/base/page';
  import { Empty } from '@cio/ui/custom/empty';
  import { RefreshPageData } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';

  import { insightsApi } from '../api';
  import InsightsDashboard from '../components/insights-dashboard.svelte';
  import InsightsRangePicker from '../components/insights-range-picker.svelte';
  import InsightsLiveIndicator from '../components/insights-live-indicator.svelte';
  import { InsightsPoller } from '../utils/insights-poller';

  let loadedOrgId = '';

  const scope = $derived({ type: 'org' as const, id: $currentOrg.id });

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || $isOrgAdmin !== true || organizationId === loadedOrgId) return;

    loadedOrgId = organizationId;
    untrack(() => void insightsApi.loadDashboard({ type: 'org', id: organizationId }));
  });

  $effect(() => {
    const intervalSeconds = insightsApi.dashboard?.refreshIntervalSeconds;
    if (!intervalSeconds) return;

    const poller = new InsightsPoller(intervalSeconds * 1000, () => void insightsApi.poll());
    poller.start();

    return () => poller.stop();
  });

  onDestroy(() => insightsApi.reset());
</script>

<svelte:head>
  <title>{$t('insights.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title class="inline-flex items-center gap-2.5">
        <span>{$t('insights.title')}</span>
        {#if $isOrgAdmin !== false}
          <InsightsLiveIndicator />
        {/if}
      </Page.Title>
    </Page.HeaderContent>
    {#if $isOrgAdmin !== false}
      <Page.Action>
        <InsightsRangePicker />
        <RefreshPageData disabled={!insightsApi.dashboard} onRefresh={() => insightsApi.refreshAll()} />
      </Page.Action>
    {/if}
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if $isOrgAdmin === false}
        <Empty icon={LockIcon} title={$t('insights.empty.not_permitted')} variant="page" />
      {:else}
        <InsightsDashboard {scope} />
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
