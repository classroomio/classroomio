<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';
  import NumericExpectedFields from './numeric-expected-fields.svelte';

  let { question, labels }: ExerciseQuestionRendererProps = $props();
</script>

<NumericExpectedFields {question} {labels} />
