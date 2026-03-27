<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';
  import OrderingDisplay from './ordering-display.svelte';

  let props: ExerciseQuestionRendererProps = $props();
</script>

<OrderingDisplay {...props} />
