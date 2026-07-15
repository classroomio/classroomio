<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';
  import { getTrueFalseCorrectIsTrue } from './true-false-correct';
  import TrueFalseReviewToggle from './true-false-review-toggle.svelte';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const correctIsTrue = $derived(
    getTrueFalseCorrectIsTrue(question.settings as Record<string, unknown> | undefined, question.options)
  );

  const studentValue = $derived.by(() => {
    if (answer?.type !== 'TRUE_FALSE') return '';
    return answer.value ? 'true' : 'false';
  });

  const isCorrect = $derived.by(() => {
    if (answer?.type !== 'TRUE_FALSE') return null;
    return answer.value === correctIsTrue;
  });
</script>

<TrueFalseReviewToggle {labels} {correctIsTrue} {studentValue} {isCorrect} />
