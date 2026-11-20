<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { cn } from '../../../../tools';
  import { latexToNumber, isWithinTolerance } from './numeric-utils';
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
  const studentText = $derived(
    answer?.type === 'NUMERIC' && answer.latex ? `$${answer.latex}$` : studentVal !== null ? String(studentVal) : ''
  );

  const correctValue = $derived(question.settings?.correctValue as number | string | undefined);
  let evaluatedCorrect = $state<number | null>(null);

  $effect(() => {
    const expression = correctValue;
    if (typeof expression !== 'string') {
      evaluatedCorrect = null;
      return;
    }

    let cancelled = false;
    void latexToNumber(expression).then((value) => {
      if (!cancelled) evaluatedCorrect = value;
    });

    return () => {
      cancelled = true;
    };
  });

  const correct = $derived(typeof correctValue === 'string' ? evaluatedCorrect : correctValue);

  const inRange = $derived.by(() => {
    if (studentVal === null || correct === undefined || correct === null) return null;
    return isWithinTolerance(studentVal, correct, question.settings ?? {});
  });
</script>

<div class="ui:space-y-2">
  <LabeledValueRow label={label('numeric.review.your_answer_label')} value={studentText || label('common.not_set')} />
  {#if inRange !== null}
    <p class={cn(inRange ? 'ui:text-xs ui:text-emerald-600' : 'ui:text-xs ui:text-red-600')}>
      {inRange ? label('numeric.review.in_range') : label('numeric.review.out_of_range')}
    </p>
  {/if}
  <NumericExpectedFields {question} {labels} />
</div>
