<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import LockIcon from '@lucide/svelte/icons/lock';
  import * as Page from '@cio/ui/base/page';
  import { Empty } from '@cio/ui/custom/empty';
  import { ROLE } from '@cio/utils/constants';
  import { cohortApi } from '$features/cohort/api';
  import { RefreshPageData } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';

  import { analyticsApi, analyticsStudentsApi, analyticsStudentSheetApi } from '../api';
  import CoursePicker from '../components/course-picker.svelte';
  import AnalyticsDashboard from '../components/analytics-dashboard.svelte';
  import AnalyticsRangePicker from '../components/analytics-range-picker.svelte';
  import AnalyticsLiveIndicator from '../components/analytics-live-indicator.svelte';
  import { AnalyticsPoller } from '../utils/analytics-poller';

  interface Props {
    cohortId: string;
  }

  let { cohortId }: Props = $props();

  let loadedKey = '';

  const memberRole = $derived(cohortApi.members.find((member) => member.profileId === $profile.id)?.roleId ?? null);
  const canView = $derived($isOrgAdmin === true || (memberRole !== null && memberRole <= ROLE.TUTOR));
  const scope = $derived({ type: 'cohort' as const, id: cohortId });
  const courses = $derived(analyticsApi.dashboard?.scope.courses ?? []);

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || !canView) return;

    const key = `${organizationId}:${cohortId}`;
    if (key === loadedKey) return;

    loadedKey = key;
    untrack(() => {
      analyticsStudentsApi.reset();
      analyticsStudentSheetApi.reset();
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
    analyticsStudentSheetApi.reset();
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
    await refreshPage({ refresh: true });
  }
</script>

<svelte:head>
  <title>{$t('analytics.title')} · {cohortApi.cohort?.name ?? ''} - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-6xl px-4">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title class="inline-flex items-center gap-2.5">
        <span>{$t('analytics.title')}</span>
        {#if canView}
          <AnalyticsLiveIndicator />
        {/if}
      </Page.Title>
    </Page.HeaderContent>
    {#if canView}
      <Page.Action>
        <AnalyticsRangePicker />
        <RefreshPageData disabled={!analyticsApi.dashboard} onRefresh={handleRefresh} />
      </Page.Action>
    {/if}
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if canView}
        <div class="space-y-6">
          {#if courses.length > 0}
            <CoursePicker {courses} value={analyticsApi.selection.courseId} onChange={handleCourseChange} />
          {/if}
          <AnalyticsDashboard {scope} />
        </div>
      {:else}
        <Empty icon={LockIcon} title={$t('analytics.empty.not_permitted')} variant="page" />
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
