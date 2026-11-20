<script lang="ts">
  import { onDestroy, untrack, type Snippet } from 'svelte';
  import { page } from '$app/state';
  import * as Page from '@cio/ui/base/page';
  import { RefreshPageData } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';

  import { analyticsApi, analyticsDrilldownApi, analyticsStudentsApi, analyticsStudentSheetApi } from '../api';
  import CoursePicker from '../components/course-picker.svelte';
  import AnalyticsDashboard from '../components/analytics-dashboard.svelte';
  import AnalyticsRangePicker from '../components/analytics-range-picker.svelte';
  import AnalyticsLiveIndicator from '../components/analytics-live-indicator.svelte';
  import { AnalyticsPoller } from '../utils/analytics-poller';

  interface Props {
    pathId: string;
    pathName: string;
    onRefresh?: () => Promise<void> | void;
    children?: Snippet;
  }

  let { pathId, pathName, onRefresh, children }: Props = $props();

  let loadedKey = '';

  const scope = $derived({ type: 'path' as const, id: pathId });
  const courses = $derived(analyticsApi.dashboard?.scope.courses ?? []);

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || !pathId) return;

    const key = `${organizationId}:${pathId}`;
    if (key === loadedKey) return;

    loadedKey = key;
    untrack(() => {
      analyticsStudentsApi.reset();
      analyticsStudentSheetApi.reset();
      analyticsDrilldownApi.reset();
      const url = new URL(page.url);
      void analyticsApi.loadDashboard(scope).then(() => analyticsStudentsApi.initFromUrl(url));
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
    analyticsStudentSheetApi.reset();
    analyticsDrilldownApi.reset();
  });

  async function refreshPage(options: { refresh?: boolean } = {}) {
    await (options.refresh ? analyticsApi.refreshAll() : analyticsApi.poll());
    await analyticsStudentsApi.refreshVisible(options);
    await analyticsStudentSheetApi.reloadIfOpen(options);
  }

  async function handleCourseChange(courseId: string | null) {
    analyticsStudentSheetApi.reset();
    await analyticsApi.selectCourse(courseId);
    await analyticsStudentsApi.load();
  }

  async function handleRefresh() {
    await Promise.all([refreshPage({ refresh: true }), onRefresh?.()]);
  }
</script>

<svelte:head>
  <title>{$t('analytics.title')} · {pathName} - ClassroomIO</title>
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
      <div class="space-y-6">
        {#if courses.length > 0}
          <CoursePicker {courses} value={analyticsApi.selection.courseId} onChange={handleCourseChange} />
        {/if}
        <AnalyticsDashboard {scope} />
        {@render children?.()}
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>
