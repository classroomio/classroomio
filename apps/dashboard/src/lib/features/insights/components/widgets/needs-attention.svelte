<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { formatCount, numberCell } from '../../utils/insights-utils';
  import type { HbarItem, WidgetRendererProps } from '../../utils/types';
  import HbarList from '../charts/hbar-list.svelte';

  let { result }: WidgetRendererProps = $props();

  const REASONS: ReadonlyArray<{ key: string; tone: HbarItem['tone'] }> = [
    { key: 'is_inactive__count_if', tone: 'danger' },
    { key: 'is_low_score__count_if', tone: 'danger' },
    { key: 'is_overdue__count_if', tone: 'warning' },
    { key: 'is_low_video__count_if', tone: 'warning' }
  ];

  const row = $derived(result.rows[0]);
  const items = $derived(
    REASONS.map(({ key, tone }): HbarItem => {
      const value = numberCell(row, key);
      const label = $t(`insights.measures.${key}`);

      return { key, label, value, display: formatCount(value), tone };
    })
  );
  const max = $derived(Math.max(1, insightsApi.dashboard?.scope.studentCount ?? 0));
</script>

<HbarList {items} {max} />
