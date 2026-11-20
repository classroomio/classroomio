<script lang="ts">
  import { hasWholeDrilldown } from '@cio/utils/analytics';
  import { ANALYTICS_RANGE_DAYS } from '@cio/utils/constants/analytics';
  import { KpiCard } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi, analyticsDrilldownApi } from '../api';
  import { formatKpi, isNowCard } from '../utils/analytics-utils';
  import type { AnalyticsScopeType, AnalyticsWidget } from '../utils/types';
  import NowTag from './now-tag.svelte';

  interface Props {
    widgets: AnalyticsWidget[];
    scopeType: AnalyticsScopeType;
    courseSelected: boolean;
    hasStudents?: boolean;
  }

  let { widgets, scopeType, courseSelected, hasStudents = true }: Props = $props();

  const gridClass = $derived(widgets.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-5');
  const range = $derived(analyticsApi.selection.range);
  const rangeDays = $derived(ANALYTICS_RANGE_DAYS[range]);
</script>

{#snippet nowTag()}
  <NowTag />
{/snippet}

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 {gridClass}">
  {#each widgets as widget (widget.id)}
    {@const state = analyticsApi.widgetState(widget.id)}
    {@const display = formatKpi(widget, state.result, $t, { scopeType, courseSelected, rangeDays, hasStudents })}
    {@const title = display.title ?? $t(widget.titleKey)}
    <KpiCard
      {title}
      value={display.value}
      description={display.description}
      trend={display.trend}
      badge={isNowCard(widget, range) ? nowTag : undefined}
      clickLabel={$t('analytics.drilldown.kpi_label', { title })}
      onClick={hasWholeDrilldown(widget.id) && state.result
        ? () => void analyticsDrilldownApi.openForWidget(widget, null)
        : undefined}
      loading={!state.result && !state.failed}
    />
  {/each}
</div>
