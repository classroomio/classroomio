<script lang="ts">
  import { cn } from '@cio/ui/tools';

  import { formatPercent, scoreTone, TONE_CELL_CLASS } from '../utils/insights-utils';
  import type { InsightsCell } from '../utils/types';

  interface Props {
    value: InsightsCell | undefined;
  }

  let { value }: Props = $props();

  const scorePct = $derived(typeof value === 'number' ? value : null);
</script>

<span
  class={cn(
    'inline-flex min-w-12 justify-center rounded-md px-2 py-1 text-xs font-medium tabular-nums',
    TONE_CELL_CLASS[scoreTone(scorePct)]
  )}
>
  {formatPercent(scorePct)}
</span>
