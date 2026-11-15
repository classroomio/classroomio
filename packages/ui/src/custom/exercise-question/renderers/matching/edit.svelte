<script lang="ts">
  import {
    getMathQuestionLabel,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '../../../../base/button';
  import { IconButton } from '../../../icon-button';
  import { MathTextInput } from '../../../math-text';
  import { getQuestionMathEditLabels } from '../../math-edit-labels';
  import { readMatchingPairs, type MatchingPair } from './matching-utils';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();

  const pairs = $derived(readMatchingPairs(question));
  const mathEditLabels = $derived(getQuestionMathEditLabels(labels));

  function patchPairs(nextPairs: MatchingPair[]) {
    const patched: ExerciseQuestionModel = {
      ...question,
      settings: { ...(question.settings ?? {}), pairs: nextPairs }
    };
    onQuestionChange(patched);
  }

  function setPair(index: number, partial: Partial<MatchingPair>) {
    patchPairs(pairs.map((pair, pairIndex) => (pairIndex === index ? { ...pair, ...partial } : pair)));
  }
</script>

<div class="ui:space-y-3">
  <p class="ui:text-muted-foreground ui:text-xs">{getMathQuestionLabel(labels, 'math.matching.edit.helper')}</p>

  {#each pairs as pair, index (index)}
    <div class="ui:flex ui:items-center ui:gap-2">
      <div class="ui:min-w-0 ui:flex-1">
        <MathTextInput
          value={pair.left}
          placeholder={getMathQuestionLabel(labels, 'math.matching.edit.left_placeholder')}
          ariaLabel={getMathQuestionLabel(labels, 'math.matching.edit.left_placeholder')}
          {disabled}
          labels={mathEditLabels}
          onValueChange={(left) => setPair(index, { left })}
        />
      </div>
      <span aria-hidden="true">↔</span>
      <div class="ui:min-w-0 ui:flex-1">
        <MathTextInput
          value={pair.right}
          placeholder={getMathQuestionLabel(labels, 'math.matching.edit.right_placeholder')}
          ariaLabel={getMathQuestionLabel(labels, 'math.matching.edit.right_placeholder')}
          {disabled}
          labels={mathEditLabels}
          onValueChange={(right) => setPair(index, { right })}
        />
      </div>
      <IconButton
        type="button"
        {disabled}
        tooltip={getMathQuestionLabel(labels, 'math.matching.edit.remove_pair')}
        onclick={() => patchPairs(pairs.filter((_, pairIndex) => pairIndex !== index))}
      >
        <XIcon class="ui:size-4" />
        <span class="ui:sr-only">{getMathQuestionLabel(labels, 'math.matching.edit.remove_pair')}</span>
      </IconButton>
    </div>
  {/each}

  <Button
    type="button"
    variant="secondary"
    size="sm"
    {disabled}
    onclick={() => patchPairs([...pairs, { left: '', right: '' }])}
  >
    <PlusIcon class="ui:size-4" />
    {getMathQuestionLabel(labels, 'math.matching.edit.add_pair')}
  </Button>
</div>
