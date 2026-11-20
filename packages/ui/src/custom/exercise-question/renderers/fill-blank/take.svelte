<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getFillBlankAnswerKey,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { Input } from '../../../../base/input';

  let {
    question,
    answer,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const blankCount = $derived(Math.max(1, getFillBlankAnswerKey(question.settings?.acceptedAnswers).length));
  const values = $derived(answer?.type === 'FILL_BLANK' ? answer.values : []);

  function blankPlaceholder(blankIndex: number): string {
    if (blankCount === 1) return label('fill_blank.take.placeholder');

    return `${label('fill_blank.edit.blank_label')} ${blankIndex + 1}`;
  }

  function setValueAt(blankIndex: number, value: string) {
    const nextValues = Array.from({ length: blankCount }, (_, index) =>
      index === blankIndex ? value : (values[index] ?? '')
    );
    onAnswerChange({ type: 'FILL_BLANK', values: nextValues });
  }
</script>

<div class="ui:flex ui:flex-col ui:gap-2">
  {#each Array.from({ length: blankCount }, (_, index) => index) as blankIndex (blankIndex)}
    <Input
      class="ui:w-full ui:max-w-[300px]"
      value={values[blankIndex] ?? ''}
      {disabled}
      placeholder={blankPlaceholder(blankIndex)}
      aria-label={blankPlaceholder(blankIndex)}
      oninput={(event) => setValueAt(blankIndex, event.currentTarget.value)}
    />
  {/each}
</div>
