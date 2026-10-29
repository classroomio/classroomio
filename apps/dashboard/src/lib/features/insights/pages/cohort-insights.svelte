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

  import { insightsApi, insightsStudentsApi, insightsStudentSheetApi } from '../api';
  import CoursePicker from '../components/course-picker.svelte';
  import InsightsDashboard from '../components/insights-dashboard.svelte';
  import InsightsRangePicker from '../components/insights-range-picker.svelte';
  import InsightsLiveIndicator from '../components/insights-live-indicator.svelte';
  import { InsightsPoller } from '../utils/insights-poller';

  interface Props {
    cohortId: string;
  }

  let { cohortId }: Props = $props();

  let loadedKey = '';

  const memberRole = $derived(cohortApi.members.find((member) => member.profileId === $profile.id)?.roleId ?? null);
  const canView = $derived($isOrgAdmin === true || (memberRole !== null && memberRole <= ROLE.TUTOR));
  const scope = $derived({ type: 'cohort' as const, id: cohortId });
  const courses = $derived(insightsApi.dashboard?.scope.courses ?? []);

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || !canView) return;

    const key = `${organizationId}:${cohortId}`;
    if (key === loadedKey) return;

    loadedKey = key;
    untrack(() => {
      insightsStudentsApi.reset();
      insightsStudentSheetApi.reset();
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
    insightsStudentSheetApi.reset();
  });

  async function refreshPage(options: { refresh?: boolean } = {}) {
    await (options.refresh ? insightsApi.refreshAll() : insightsApi.poll());
    await insightsStudentsApi.refreshVisible(options);
    await insightsStudentSheetApi.reloadIfOpen(options);
  }

  async function handleCourseChange(courseId: string | null) {
    insightsStudentSheetApi.reset();
    await insightsApi.selectCourse(courseId);
    await insightsStudentsApi.load();
  }

  async function handleRefresh() {
    await refreshPage({ refresh: true });
  }
</script>

<svelte:head>
  <title>{$t('insights.title')} · {cohortApi.cohort?.name ?? ''} - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-6xl px-4">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title class="inline-flex items-center gap-2.5">
        <span>{$t('insights.title')}</span>
        {#if canView}
          <InsightsLiveIndicator />
        {/if}
      </Page.Title>
    </Page.HeaderContent>
    {#if canView}
      <Page.Action>
        <InsightsRangePicker />
        <RefreshPageData disabled={!insightsApi.dashboard} onRefresh={handleRefresh} />
      </Page.Action>
    {/if}
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if canView}
        <div class="space-y-6">
          {#if courses.length > 0}
            <CoursePicker {courses} value={insightsApi.selection.courseId} onChange={handleCourseChange} />
          {/if}
          <InsightsDashboard {scope} />
        </div>
      {:else}
        <Empty icon={LockIcon} title={$t('insights.empty.not_permitted')} variant="page" />
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
