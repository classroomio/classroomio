<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';
  import { MathText } from '../../../math-text';
  import { readMatchingPairs } from './matching-utils';

  let { question }: ExerciseQuestionRendererProps = $props();

  const pairs = $derived(readMatchingPairs(question));
</script>

<div class="ui:space-y-1">
  {#each pairs as pair, index (index)}
    <p class="ui:text-sm"><MathText text={pair.left} /> ↔ <MathText text={pair.right} /></p>
  {/each}
</div>
