<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { formatPercent, numberCell, questionHint, textCell } from '../../utils/insights-utils';
  import type { HbarItem, WidgetRendererProps } from '../../utils/types';
  import HbarList from '../charts/hbar-list.svelte';

  let { result }: WidgetRendererProps = $props();

  function correctnessTone(value: number | null): HbarItem['tone'] {
    if (value === null) return 'muted';

    if (value < 50) return 'danger';

    return value < 65 ? 'warning' : 'info';
  }

  const items = $derived(
    result.rows.map((row, index): HbarItem => {
      const key = String(row['question_id'] ?? index);
      const label = textCell(row, 'question_label') ?? '';
      const value = numberCell(row, 'correct_pct__avg');
      const context = textCell(row, 'question_context__value');
      const wrongAnswer = textCell(row, 'wrong_answer__mode');
      const hint = questionHint(context, wrongAnswer, $t);

      return { key, label, value, display: formatPercent(value), hint, tone: correctnessTone(value) };
    })
  );
</script>

<HbarList {items} />
