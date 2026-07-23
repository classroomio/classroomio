<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';
  import { getThumbsCorrectIsYes } from './thumbs-correct';
  import ThumbsReviewToggle from './thumbs-review-toggle.svelte';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const correctIsYes = $derived(
    getThumbsCorrectIsYes(question.settings as Record<string, unknown> | undefined, question.options)
  );

  const studentValue = $derived.by(() => {
    if (answer?.type !== 'THUMBS') return '';
    return answer.value ? 'true' : 'false';
  });

  const isCorrect = $derived.by(() => {
    if (answer?.type !== 'THUMBS') return null;
    return answer.value === correctIsYes;
  });
</script>

<ThumbsReviewToggle {labels} {correctIsYes} {studentValue} {isCorrect} />
