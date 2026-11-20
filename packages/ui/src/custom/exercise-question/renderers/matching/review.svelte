<script lang="ts">
  import { getMathQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { cn } from '../../../../tools';
  import { MathText } from '../../../math-text';
  import { readMatchingPairs } from './matching-utils';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const rows = $derived.by(() => {
    const chosenByLeft = new Map(
      answer?.type === 'MATCHING' ? answer.pairs.map((pair) => [pair.left, pair.right]) : []
    );

    return readMatchingPairs(question).map((pair) => {
      const chosen = chosenByLeft.get(pair.left);

      return { ...pair, chosen, isCorrect: chosen === pair.right };
    });
  });
</script>

<div class="ui:space-y-2">
  {#each rows as row, rowIndex (rowIndex)}
    <div
      class={cn(
        'ui:rounded-md ui:border ui:px-3 ui:py-2 ui:text-sm',
        row.isCorrect
          ? 'ui:border-emerald-600/40 ui:bg-emerald-50 ui:dark:bg-emerald-950/30'
          : 'ui:border-red-600/40 ui:bg-red-50 ui:dark:bg-red-950/30'
      )}
    >
      <MathText text={row.left} /> ↔
      {#if row.chosen}
        <MathText text={row.chosen} />
      {:else}
        <span class="ui:text-muted-foreground">{getMathQuestionLabel(labels, 'math.matching.review.not_matched')}</span>
      {/if}
      {#if !row.isCorrect}
        <p class="ui:text-muted-foreground ui:text-xs">
          {getMathQuestionLabel(labels, 'math.matching.review.expected')}: <MathText text={row.right} />
        </p>
      {/if}
    </div>
  {/each}
</div>
