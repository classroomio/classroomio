<script lang="ts">
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import { Button } from '@cio/ui/base/button';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Empty } from '@cio/ui/custom/empty';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';

  import { analyticsApi } from '../api';
  import { fillRowSpans, hasNoStudents } from '../utils/analytics-utils';
  import type { AnalyticsScopeRef, AnalyticsWidgetContext } from '../utils/types';
  import AnalyticsBreakdownPicker from './analytics-breakdown-picker.svelte';
  import AnalyticsKpiRow from './analytics-kpi-row.svelte';
  import AnalyticsScopeNotice from './analytics-scope-notice.svelte';
  import AnalyticsWidget from './analytics-widget.svelte';

  interface Props {
    scope: AnalyticsScopeRef;
  }

  let { scope }: Props = $props();

  const kpiWidgets = $derived(analyticsApi.displayWidgets.filter((widget) => widget.viz === 'kpi'));
  const panelWidgets = $derived(analyticsApi.displayWidgets.filter((widget) => widget.viz !== 'kpi'));
  const panelSpans = $derived(fillRowSpans(panelWidgets));
  const context = $derived<AnalyticsWidgetContext>({
    scopeType: scope.type,
    scopeId: scope.id,
    orgSlug: $currentOrg.siteName,
    range: analyticsApi.selection.range,
    courseCount: analyticsApi.dashboard?.scope.courses.length ?? 0,
    courseSelected: Boolean(analyticsApi.selection.courseId),
    cohortCount: analyticsApi.dashboard?.scope.cohortCount ?? 0,
    studentCount: analyticsApi.dashboard?.scope.studentCount ?? 0,
    emptyCohorts: analyticsApi.widgetResult('cohort_empty')
  });
</script>

{#if analyticsApi.dashboardFailed}
  <Empty icon={CircleAlertIcon} title={$t('analytics.empty.dashboard_failed')} variant="page">
    <Button variant="outline" size="sm" onclick={() => analyticsApi.loadDashboard(scope)}
      >{$t('analytics.retry')}</Button
    >
  </Empty>
{:else if !analyticsApi.dashboard}
  <div class="space-y-6" aria-busy="true">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {#each [0, 1, 2, 3, 4] as index (index)}
        <Skeleton class="h-[118px] w-full rounded-xl" />
      {/each}
    </div>
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {#each ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-12'] as spanClass (spanClass)}
        <Skeleton class="h-[320px] w-full rounded-xl {spanClass}" />
      {/each}
    </div>
  </div>
{:else}
  <div class="space-y-6">
    {#if hasNoStudents(analyticsApi.dashboard)}
      <AnalyticsScopeNotice summary={analyticsApi.dashboard.scope} />
    {/if}
    {#if kpiWidgets.length > 0}
      <AnalyticsKpiRow
        widgets={kpiWidgets}
        courseSelected={context.courseSelected}
        hasStudents={context.studentCount > 0}
      />
    {/if}
    {#if analyticsApi.availableBreakdowns.length > 1}
      <div class="flex justify-end">
        <AnalyticsBreakdownPicker />
      </div>
    {/if}
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {#each panelWidgets as widget (widget.id)}
        <AnalyticsWidget {widget} span={panelSpans.get(widget.id) ?? widget.span} {context} />
      {/each}
    </div>
  </div>
{/if}
