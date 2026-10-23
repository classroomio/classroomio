<script lang="ts">
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  import { passTone, TONE_CELL_CLASS } from '../utils/insights-utils';
  import type { LearnerExerciseCell } from '../utils/types';

  interface Props {
    cell: LearnerExerciseCell | undefined;
    passMark: number | null;
  }

  let { cell, passMark }: Props = $props();

  const tone = $derived(cell?.state === 'graded' ? passTone(cell.scorePct, passMark) : 'muted');
</script>

<span
  class={cn(
    'inline-flex min-w-12 justify-center rounded-md px-2 py-1 text-xs font-medium tabular-nums',
    TONE_CELL_CLASS[tone]
  )}
>
  {#if cell?.state === 'graded' && cell.scorePct !== null}
    {Math.round(cell.scorePct)}%
  {:else if cell?.state === 'awaiting_grade'}
    <span title={$t('insights.awaiting_grade')}>{$t('insights.awaiting_grade_short')}</span>
  {:else}
    –
  {/if}
</span>
