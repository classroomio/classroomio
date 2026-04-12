<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';

  import GenericSubmission from '../submission-generic.svelte';

  let {
    question,
    submissions = [],
    labels,
    maxSubmissionItems
  }: Pick<ExerciseQuestionRendererProps, 'question' | 'submissions' | 'labels' | 'maxSubmissionItems'> = $props();
</script>

<GenericSubmission {question} {submissions} {labels} {maxSubmissionItems} />
