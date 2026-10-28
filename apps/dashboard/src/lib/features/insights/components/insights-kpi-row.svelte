<script lang="ts">
  import { INSIGHTS_RANGE_DAYS } from '@cio/utils/constants/insights';
  import { KpiCard } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../api';
  import { formatKpi, isNowCard } from '../utils/insights-utils';
  import type { InsightsWidget } from '../utils/types';
  import NowTag from './now-tag.svelte';

  interface Props {
    widgets: InsightsWidget[];
    courseSelected: boolean;
    hasStudents?: boolean;
  }

  let { widgets, courseSelected, hasStudents = true }: Props = $props();

  const gridClass = $derived(widgets.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-5');
  const range = $derived(insightsApi.selection.range);
  const rangeDays = $derived(INSIGHTS_RANGE_DAYS[range]);
</script>

{#snippet nowTag()}
  <NowTag />
{/snippet}

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 {gridClass}">
  {#each widgets as widget (widget.id)}
    {@const state = insightsApi.widgetState(widget.id)}
    {@const display = formatKpi(widget, state.result, $t, { courseSelected, rangeDays, hasStudents })}
    <KpiCard
      title={display.title ?? $t(widget.titleKey)}
      value={display.value}
      description={display.description}
      trend={display.trend}
      badge={isNowCard(widget, range) ? nowTag : undefined}
      loading={!state.result && !state.failed}
    />
  {/each}
</div>
