<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getMathQuestionLabel,
    readMathExpressionSettings,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import LabeledValueRow from '../shared/labeled-value-row.svelte';
  import MathGradeResult from '../math/math-grade-result.svelte';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const settings = $derived(readMathExpressionSettings(question.settings));
  const grading = $derived(answer?.type === 'MATH_EXPRESSION' ? answer.grading : undefined);
  const studentText = $derived(answer?.type === 'MATH_EXPRESSION' && answer.latex ? `$${answer.latex}$` : '');
  const acceptedText = $derived(settings.acceptedAnswers.map((accepted) => `$${accepted}$`).join(',  '));
</script>

<div class="ui:space-y-2">
  <LabeledValueRow
    label={getMathQuestionLabel(labels, 'math.review.your_answer')}
    value={studentText || getExerciseQuestionLabel(labels, 'common.not_set')}
  />
  {#if grading}
    <MathGradeResult
      reason={grading.reason}
      requiredForm={grading.requiredForm}
      feedback={grading.feedback}
      matchedAnswer={grading.matchedAnswer}
      {labels}
    />
  {:else}
    <p class="ui:text-muted-foreground ui:text-xs">{getMathQuestionLabel(labels, 'math.review.not_graded')}</p>
  {/if}
  {#if acceptedText}
    <LabeledValueRow label={getMathQuestionLabel(labels, 'math.review.expected')} value={acceptedText} />
  {/if}
</div>
