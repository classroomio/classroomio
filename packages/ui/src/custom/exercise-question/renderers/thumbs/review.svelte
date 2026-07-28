<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';
  import ThumbsReviewToggle from './thumbs-review-toggle.svelte';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const studentValue = $derived.by(() => {
    if (answer?.type !== 'THUMBS') return '';
    return answer.value ? 'true' : 'false';
  });
</script>

<ThumbsReviewToggle {labels} options={question.options} {studentValue} />
