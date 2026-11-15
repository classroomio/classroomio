<script lang="ts">
  import {
    getMathQuestionLabel,
    type ExerciseQuestionLabels,
    type MathGradeReason,
    type MathQuestionLabelKey,
    type MathRequiredForm
  } from '@cio/question-types';
  import CheckIcon from '@lucide/svelte/icons/check';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import XIcon from '@lucide/svelte/icons/x';
  import { cn } from '../../../../tools';
  import { MathText } from '../../../math-text';

  interface Props {
    reason: MathGradeReason;
    labels?: ExerciseQuestionLabels;
    requiredForm?: MathRequiredForm;
    feedback?: string;
    matchedAnswer?: string;
  }

  let { reason, labels, requiredForm, feedback, matchedAnswer }: Props = $props();

  const label = (key: MathQuestionLabelKey) => getMathQuestionLabel(labels, key);

  const isCorrect = $derived(reason === 'equivalent');
  const isPartial = $derived(reason === 'not_simplified' || reason === 'wrong_form' || reason === 'wrong_units');
  const isUnknown = $derived(reason === 'needs_review' || reason === 'invalid');
  const verdictLabel = $derived(label(`math.verdict.${reason}`));
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
  data-testid="math-grade-result"
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
    <p class="ui:font-medium">
      {verdictLabel}{#if requiredForm}{' '}({label(`math.edit.form.${requiredForm}`)}){/if}
    </p>
    {#if matchedAnswer && isCorrect}
      <p class="ui:text-xs">{label('math.verdict.matched_label')}: <MathText text={`$${matchedAnswer}$`} /></p>
    {/if}
    {#if feedback}
      <p class="ui:text-xs"><MathText text={feedback} /></p>
    {/if}
  </div>
</div>
