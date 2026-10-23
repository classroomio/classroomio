<script lang="ts">
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import { Button } from '@cio/ui/base/button';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Empty } from '@cio/ui/custom/empty';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../api';
  import { fillRowSpans } from '../utils/insights-utils';
  import type { InsightsScopeRef } from '../utils/types';
  import InsightsKpiRow from './insights-kpi-row.svelte';
  import InsightsWidget from './insights-widget.svelte';

  interface Props {
    scope: InsightsScopeRef;
  }

  let { scope }: Props = $props();

  const kpiWidgets = $derived(insightsApi.visibleWidgets.filter((widget) => widget.viz === 'kpi'));
  const panelWidgets = $derived(insightsApi.visibleWidgets.filter((widget) => widget.viz !== 'kpi'));
  const panelSpans = $derived(fillRowSpans(panelWidgets));
</script>

{#if insightsApi.dashboardFailed}
  <Empty icon={CircleAlertIcon} title={$t('insights.empty.dashboard_failed')} variant="page">
    <Button variant="outline" size="sm" onclick={() => insightsApi.loadDashboard(scope)}>{$t('insights.retry')}</Button>
  </Empty>
{:else if !insightsApi.dashboard}
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
    {#if kpiWidgets.length > 0}
      <InsightsKpiRow widgets={kpiWidgets} />
    {/if}
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {#each panelWidgets as widget (widget.id)}
        <InsightsWidget {widget} span={panelSpans.get(widget.id) ?? widget.span} />
      {/each}
    </div>
  </div>
{/if}
