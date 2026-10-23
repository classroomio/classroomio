<script lang="ts">
  import { KpiCard } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../api';
  import { formatKpi } from '../utils/insights-utils';
  import type { InsightsWidget } from '../utils/types';

  interface Props {
    widgets: InsightsWidget[];
  }

  let { widgets }: Props = $props();

  const gridClass = $derived(widgets.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-5');
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 {gridClass}">
  {#each widgets as widget (widget.id)}
    {@const state = insightsApi.widgetState(widget.id)}
    {@const display = formatKpi(widget, state.result, $t)}
    <KpiCard
      title={$t(widget.titleKey)}
      value={display.value}
      description={display.description}
      loading={!state.result && !state.failed}
    />
  {/each}
</div>
