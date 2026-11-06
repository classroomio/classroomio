<script lang="ts">
  import { Progress } from '@cio/ui/base/progress';

  import { formatPercent } from '../utils/insights-utils';
  import type { InsightsCell } from '../utils/types';

  interface Props {
    value: InsightsCell | undefined;
  }

  let { value }: Props = $props();

  const progress = $derived(typeof value === 'number' ? Math.min(100, Math.max(0, value)) : 0);
</script>

<div class="flex min-w-[90px] items-center gap-2">
  <Progress value={progress} class="h-2 flex-1" />
  <span class="w-10 text-right text-xs tabular-nums">{formatPercent(value)}</span>
</div>
