<script lang="ts">
  import {
    getMathQuestionLabel,
    type ExerciseQuestionLabels,
    type GraphGradeReason,
    type MathQuestionLabelKey
  } from '@cio/question-types';
  import CheckIcon from '@lucide/svelte/icons/check';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import XIcon from '@lucide/svelte/icons/x';
  import { cn } from '../../../../tools';

  interface Props {
    reason: GraphGradeReason;
    matched?: number;
    total?: number;
    /** Show how many expected elements matched; a graph reading is one value, so it leaves this off. */
    showCount?: boolean;
    labels?: ExerciseQuestionLabels;
  }

  let { reason, matched = 0, total = 0, showCount = false, labels }: Props = $props();

  const label = (key: MathQuestionLabelKey) => getMathQuestionLabel(labels, key);

  const isCorrect = $derived(reason === 'correct');
  const isPartial = $derived(reason === 'partial' || reason === 'extra');
  const isUnknown = $derived(reason === 'not_set');
  const countText = $derived(
    label('math.graph.review.matched').replace('{matched}', String(matched)).replace('{total}', String(total))
  );
</script>

<div
  class={cn(
    'ui:flex ui:items-start ui:gap-2 ui:rounded-md ui:border ui:px-3 ui:py-2 ui:text-sm',
    isCorrect &&
      'ui:border-emerald-600/40 ui:bg-emerald-50 ui:text-emerald-800 ui:dark:bg-emerald-950/30 ui:dark:text-emerald-300',
    isPartial &&
      'ui:border-amber-600/40 ui:bg-amber-50 ui:text-amber-900 ui:dark:bg-amber-950/30 ui:dark:text-amber-300',
    isUnknown && 'ui:border-border ui:bg-muted ui:text-muted-foreground',
    !isCorrect &&
      !isPartial &&
      !isUnknown &&
      'ui:border-red-600/40 ui:bg-red-50 ui:text-red-800 ui:dark:bg-red-950/30 ui:dark:text-red-300'
  )}
  data-testid="graph-grade-result"
  data-reason={reason}
>
  {#if isCorrect}
    <CheckIcon class="ui:mt-0.5 ui:size-4 ui:shrink-0" />
  {:else if isPartial || isUnknown}
    <CircleAlertIcon class="ui:mt-0.5 ui:size-4 ui:shrink-0" />
  {:else}
    <XIcon class="ui:mt-0.5 ui:size-4 ui:shrink-0" />
  {/if}
  <div class="ui:min-w-0 ui:space-y-1">
    <p class="ui:font-medium">{label(`math.graph.verdict.${reason}`)}</p>
    {#if showCount && total > 0}
      <p class="ui:text-xs" data-testid="graph-matched-count">{countText}</p>
    {/if}
  </div>
</div>
