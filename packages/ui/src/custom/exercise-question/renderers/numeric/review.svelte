<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { cn } from '../../../../tools';
  import LabeledValueRow from '../shared/labeled-value-row.svelte';
  import NumericExpectedFields from './numeric-expected-fields.svelte';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const studentVal = $derived.by(() => {
    if (answer?.type !== 'NUMERIC' || typeof answer.value !== 'number' || !Number.isFinite(answer.value)) {
      return null;
    }
    return answer.value;
  });

  const correct = $derived(question.settings?.correctValue as number | undefined);
  const tolerance = $derived((question.settings?.tolerance as number | undefined) ?? 0);

  const inRange = $derived.by(() => {
    if (studentVal === null || correct === undefined) return null;
    return Math.abs(studentVal - correct) <= tolerance;
  });
</script>

<div class="ui:space-y-2">
  <LabeledValueRow
    label={label('numeric.review.your_answer_label')}
    value={studentVal !== null ? String(studentVal) : label('common.not_set')}
  />
  {#if studentVal !== null && correct !== undefined && inRange !== null}
    <p class={cn(inRange ? 'ui:text-xs ui:text-emerald-600' : 'ui:text-xs ui:text-red-600')}>
      {inRange ? label('numeric.review.in_range') : label('numeric.review.out_of_range')}
    </p>
  {/if}
  <NumericExpectedFields {question} {labels} />
</div>
