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

  import { insightsApi, insightsLearnersApi } from '../api';
  import CoursePicker from '../components/course-picker.svelte';
  import InsightsDashboard from '../components/insights-dashboard.svelte';
  import UpdatedAgo from '../components/updated-ago.svelte';
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

  async function handleCourseChange(courseId: string | null) {
    await Promise.all([insightsApi.selectCourse(courseId), insightsLearnersApi.load()]);
  }

  async function handleRefresh() {
    await Promise.all([insightsApi.refreshAll(), insightsLearnersApi.refreshVisible()]);
  }
</script>

<svelte:head>
  <title>{$t('insights.title')} · {cohortApi.cohort?.name ?? ''} - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-6xl px-4">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('insights.title')}</Page.Title>
      {#if canView}
        <p class="ui:text-muted-foreground text-sm">
          {$t('insights.subtitle.cohort', { count: insightsApi.dashboard?.scope.learnerCount ?? 0 })}
        </p>
      {/if}
    </Page.HeaderContent>
    {#if canView}
      <Page.Action>
        {#if courses.length > 1}
          <CoursePicker {courses} value={insightsApi.selection.courseId} onChange={handleCourseChange} />
        {/if}
        <UpdatedAgo generatedAt={insightsApi.generatedAt} />
        <RefreshPageData disabled={!insightsApi.dashboard} onRefresh={handleRefresh} />
      </Page.Action>
    {/if}
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if canView}
        <InsightsDashboard {scope} />
      {:else}
        <Empty icon={LockIcon} title={$t('insights.empty.not_permitted')} variant="page" />
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>
