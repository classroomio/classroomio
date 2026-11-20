<script lang="ts">
  import { getMathQuestionLabel, readGraphReadSettings, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import LabeledValueRow from '../shared/labeled-value-row.svelte';
  import GraphBoard from '../graph/graph-board.svelte';

  let { question, labels }: ExerciseQuestionRendererProps = $props();

  const settings = $derived(readGraphReadSettings(question.settings));
  const key = $derived(settings.answer);
  const expectedText = $derived(
    !key ? '' : key.kind === 'value' ? `${key.value} (± ${key.tolerance})` : `(${key.x}, ${key.y}) (± ${key.tolerance})`
  );
</script>

<div class="ui:space-y-2">
  <GraphBoard board={settings.board} curves={settings.curves} markedPoints={settings.points} {labels} />
  {#if expectedText}
    <LabeledValueRow label={getMathQuestionLabel(labels, 'math.graph.review.expected_read')} value={expectedText} />
  {:else}
    <p class="ui:text-muted-foreground ui:text-sm">{getMathQuestionLabel(labels, 'math.graph.preview.empty')}</p>
  {/if}
</div>
