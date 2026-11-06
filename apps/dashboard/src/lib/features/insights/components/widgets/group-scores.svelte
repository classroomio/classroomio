<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { dimensionLabel, groupScoreDisplay, numberCell } from '../../utils/insights-utils';
  import type { HbarItem, WidgetRendererProps } from '../../utils/types';
  import HbarList from '../charts/hbar-list.svelte';

  let { widget, result }: WidgetRendererProps = $props();

  const dimension = $derived(widget.spec.dimensions?.[0] ?? 'cohort');
  const measureKey = $derived(
    result.columns.find((column) => column.key.startsWith('avg_score_pct__'))?.key ?? 'avg_score_pct__value'
  );
  const countKey = $derived(
    result.columns.some((column) => column.key === 'students__value') ? 'students__value' : 'rows__count'
  );

  const items = $derived(
    result.rows.map((row, index): HbarItem => {
      const value = numberCell(row, measureKey);
      const label = dimensionLabel(row, dimension, $t);
      const display = groupScoreDisplay(row, value, countKey, $t);
      const tone = value === null ? 'muted' : undefined;

      return { key: String(row[`${dimension}_id`] ?? index), label, value, display, tone };
    })
  );
</script>

<HbarList {items} />
