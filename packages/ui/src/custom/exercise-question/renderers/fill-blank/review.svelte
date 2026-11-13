<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getFillBlankAnswerKey,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import LabeledValueRow from '../shared/labeled-value-row.svelte';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const answerKey = $derived(getFillBlankAnswerKey(question.settings?.acceptedAnswers));
  const studentValues = $derived(answer?.type === 'FILL_BLANK' ? answer.values : []);
  const blankCount = $derived(Math.max(answerKey.length, studentValues.length));

  function studentAtBlank(blankIndex: number): string {
    const value = String(studentValues[blankIndex] ?? '').trim();
    return value || label('common.not_set');
  }

  function acceptedAtBlank(blankIndex: number): string {
    const alternatives = answerKey[blankIndex] ?? [];
    return alternatives.length > 0 ? alternatives.join(' / ') : label('common.not_set');
  }
</script>

<div class="ui:space-y-2">
  {#if blankCount === 0}
    <LabeledValueRow label={label('fill_blank.review.your_answer_label')} value={label('common.not_set')} />
  {/if}
  {#each Array.from({ length: blankCount }, (_, index) => index) as blankIndex (blankIndex)}
    <div class="ui:space-y-0.5">
      <p class="ui:text-sm ui:font-medium">{label('fill_blank.edit.blank_label')} {blankIndex + 1}</p>
      <LabeledValueRow label={label('fill_blank.review.your_answer_label')} value={studentAtBlank(blankIndex)} />
      <LabeledValueRow
        label={`${label('fill_blank.preview.accepted_answers_label')}:`}
        value={acceptedAtBlank(blankIndex)}
        class="ui:text-muted-foreground"
      />
    </div>
  {/each}
</div>
