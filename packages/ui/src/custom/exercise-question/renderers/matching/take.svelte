<script lang="ts">
  import { getMathQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import * as Select from '../../../../base/select';
  import { MathText } from '../../../math-text';
  import { orderRightItems, readMatchingPairs } from './matching-utils';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const pairs = $derived(readMatchingPairs(question));
  const rightItems = $derived(orderRightItems(question, pairs));
  const chosenByLeft = $derived(
    new Map(answer?.type === 'MATCHING' ? answer.pairs.map((pair) => [pair.left, pair.right]) : [])
  );

  function choose(left: string, right: string) {
    const nextChosen = new Map(chosenByLeft);
    nextChosen.set(left, right);

    onAnswerChange({
      type: 'MATCHING',
      pairs: pairs
        .filter((pair) => nextChosen.has(pair.left))
        .map((pair) => ({ left: pair.left, right: nextChosen.get(pair.left) ?? '' }))
    });
  }
</script>

<div class="ui:space-y-3">
  <p class="ui:text-muted-foreground ui:text-sm">{getMathQuestionLabel(labels, 'math.matching.take.choose')}</p>

  {#each pairs as pair, index (index)}
    {@const chosen = chosenByLeft.get(pair.left)}
    <div class="ui:flex ui:items-center ui:gap-3">
      <div class="ui:min-w-0 ui:flex-1 ui:text-sm"><MathText text={pair.left} /></div>
      <Select.Root type="single" value={chosen ?? ''} {disabled} onValueChange={(value) => choose(pair.left, value)}>
        <Select.Trigger class="ui:w-56" aria-label={pair.left}>
          {#if chosen}
            <MathText text={chosen} />
          {:else}
            <span class="ui:text-muted-foreground"
              >{getMathQuestionLabel(labels, 'math.matching.review.not_matched')}</span
            >
          {/if}
        </Select.Trigger>
        <Select.Content>
          {#each rightItems as right (right)}
            <Select.Item value={right}><MathText text={right} /></Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  {/each}
</div>
