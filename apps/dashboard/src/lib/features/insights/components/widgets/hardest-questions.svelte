<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { formatPercent, numberCell, textCell } from '../../utils/insights-utils';
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
      const display = formatPercent(value);
      const wrongAnswer = textCell(row, 'wrong_answer__mode');
      const hint = wrongAnswer ? $t('insights.most_common_wrong_answer', { answer: wrongAnswer }) : undefined;
      const tone = correctnessTone(value);

      return { key, label, value, display, hint, tone };
    })
  );
</script>

<HbarList {items} />
<p class="ui:text-muted-foreground mt-3 text-xs">{$t('insights.notes.hardest_questions')}</p>
