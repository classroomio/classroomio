<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import LockIcon from '@lucide/svelte/icons/lock';
  import * as Page from '@cio/ui/base/page';
  import { Empty } from '@cio/ui/custom/empty';
  import { RefreshPageData } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';

  import { analyticsApi } from '../api';
  import AnalyticsDashboard from '../components/analytics-dashboard.svelte';
  import AnalyticsRangePicker from '../components/analytics-range-picker.svelte';
  import AnalyticsLiveIndicator from '../components/analytics-live-indicator.svelte';
  import { AnalyticsPoller } from '../utils/analytics-poller';

  let loadedOrgId = '';

  const scope = $derived({ type: 'org' as const, id: $currentOrg.id });

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || $isOrgAdmin !== true || organizationId === loadedOrgId) return;

    loadedOrgId = organizationId;
    untrack(() => void analyticsApi.loadDashboard({ type: 'org', id: organizationId }));
  });

  $effect(() => {
    const intervalSeconds = analyticsApi.dashboard?.refreshIntervalSeconds;
    if (!intervalSeconds) return;

    const poller = new AnalyticsPoller(intervalSeconds * 1000, () => void analyticsApi.poll());
    poller.start();

    return () => poller.stop();
  });

  onDestroy(() => analyticsApi.reset());
</script>

<svelte:head>
  <title>{$t('analytics.org_page_title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title class="inline-flex items-center gap-2.5">
        <span>{$t('analytics.org_page_title')}</span>
        {#if $isOrgAdmin !== false}
          <AnalyticsLiveIndicator />
        {/if}
      </Page.Title>
    </Page.HeaderContent>
    {#if $isOrgAdmin !== false}
      <Page.Action>
        <AnalyticsRangePicker />
        <RefreshPageData disabled={!analyticsApi.dashboard} onRefresh={() => analyticsApi.refreshAll()} />
      </Page.Action>
    {/if}
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if $isOrgAdmin === false}
        <Empty icon={LockIcon} title={$t('analytics.empty.not_permitted')} variant="page" />
      {:else}
        <AnalyticsDashboard {scope} />
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
