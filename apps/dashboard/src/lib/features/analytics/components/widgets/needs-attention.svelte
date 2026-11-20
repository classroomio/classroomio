<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi } from '../../api';
  import { ATTENTION_REASONS, formatCount, numberCell } from '../../utils/analytics-utils';
  import type { HbarItem, WidgetRendererProps } from '../../utils/types';
  import HbarList from '../charts/hbar-list.svelte';

  let { result, onSegmentSelect }: WidgetRendererProps = $props();

  const row = $derived(result.rows[0]);
  const items = $derived(
    ATTENTION_REASONS.map(({ key, tone }): HbarItem => {
      const value = numberCell(row, key);
      const label = $t(`analytics.measures.${key}`);

      return { key, label, value, display: formatCount(value), tone };
    })
  );
  const max = $derived(Math.max(1, analyticsApi.dashboard?.scope.studentCount ?? 0));
</script>

<HbarList {items} {max} onSelect={onSegmentSelect} />
