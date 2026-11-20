<script lang="ts">
  import {
    getMathQuestionLabel,
    getWorkedSolutionPointSplit,
    readWorkedSolutionSettings,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import LabeledValueRow from '../shared/labeled-value-row.svelte';

  let { question, labels }: ExerciseQuestionRendererProps = $props();

  const settings = $derived(readWorkedSolutionSettings(question.settings, Number(question.points ?? 0)));
  const split = $derived(getWorkedSolutionPointSplit(question.settings, Number(question.points ?? 0)));
  const acceptedText = $derived(settings.acceptedAnswers.map((answer) => `$${answer}$`).join(',  '));
</script>

<div class="ui:space-y-1">
  {#if acceptedText}
    <LabeledValueRow label={getMathQuestionLabel(labels, 'math.preview.accepted_label')} value={acceptedText} />
  {:else}
    <p class="ui:text-muted-foreground ui:text-sm">{getMathQuestionLabel(labels, 'math.preview.empty')}</p>
  {/if}
  <LabeledValueRow
    label={getMathQuestionLabel(labels, 'math.worked.review.answer_points')}
    value={String(split.answerPoints)}
  />
  <LabeledValueRow
    label={getMathQuestionLabel(labels, 'math.worked.review.working_points')}
    value={String(split.workingPoints)}
  />
</div>
