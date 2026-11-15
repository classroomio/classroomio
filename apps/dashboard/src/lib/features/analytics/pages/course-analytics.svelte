<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import * as Page from '@cio/ui/base/page';
  import { RefreshPageData } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import { findOwnerOrgToSwitch } from '$features/org/utils/owner-org-utils';
  import { currentOrg, orgs } from '$lib/utils/store/org';

  import { analyticsApi, analyticsStudentsApi } from '../api';
  import AnalyticsDashboard from '../components/analytics-dashboard.svelte';
  import AnalyticsRangePicker from '../components/analytics-range-picker.svelte';
  import AnalyticsLiveIndicator from '../components/analytics-live-indicator.svelte';
  import { AnalyticsPoller } from '../utils/analytics-poller';

  interface Props {
    courseId: string;
  }

  let { courseId }: Props = $props();

  let loadedKey = '';

  const scope = $derived({ type: 'course' as const, id: courseId });
  const ownerOrgId = $derived(courseApi.course?.id === courseId ? courseApi.course.group?.organizationId : undefined);

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || !ownerOrgId) return;
    if (findOwnerOrgToSwitch(ownerOrgId, organizationId, $orgs)) return;

    const key = `${organizationId}:${courseId}`;
    if (key === loadedKey) return;

    loadedKey = key;
    untrack(() => {
      analyticsStudentsApi.reset();
      void analyticsApi.loadDashboard(scope).then(() => analyticsStudentsApi.load());
    });
  });

  $effect(() => {
    const intervalSeconds = analyticsApi.dashboard?.refreshIntervalSeconds;
    if (!intervalSeconds) return;

    const poller = new AnalyticsPoller(intervalSeconds * 1000, () => void refreshPage());
    poller.start();

    return () => poller.stop();
  });

  onDestroy(() => {
    analyticsApi.reset();
    analyticsStudentsApi.reset();
  });

  async function refreshPage(options: { refresh?: boolean } = {}) {
    await (options.refresh ? analyticsApi.refreshAll() : analyticsApi.poll());
    await analyticsStudentsApi.refreshVisible(options);
  }

  async function handleRefresh() {
    await refreshPage({ refresh: true });
  }
</script>

<svelte:head>
  <title>{$t('analytics.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-6xl px-4">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title class="inline-flex items-center gap-2.5">
        <span>{$t('analytics.title')}</span>
        <AnalyticsLiveIndicator />
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <AnalyticsRangePicker />
      <RefreshPageData disabled={!analyticsApi.dashboard} onRefresh={handleRefresh} />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <AnalyticsDashboard {scope} />
    {/snippet}
  </Page.Body>
</Page.Root>
