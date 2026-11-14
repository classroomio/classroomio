<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getFillBlankAnswerKey,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import LabeledValueRow from '../shared/labeled-value-row.svelte';

  let { question, labels }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const answerKey = $derived(getFillBlankAnswerKey(question.settings?.acceptedAnswers));
</script>

<div class="ui:space-y-1">
  <p class="ui:text-muted-foreground ui:text-sm">{label('fill_blank.preview.accepted_answers_label')}:</p>
  {#each answerKey as alternatives, blankIndex (blankIndex)}
    <LabeledValueRow
      label={`${label('fill_blank.edit.blank_label')} ${blankIndex + 1}`}
      value={alternatives.join(' / ')}
    />
  {:else}
    <p class="ui:text-muted-foreground ui:text-sm">{label('common.not_set')}</p>
  {/each}
</div>
