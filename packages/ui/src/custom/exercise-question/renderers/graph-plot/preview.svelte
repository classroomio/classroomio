<script lang="ts">
  import { getMathQuestionLabel, readGraphPlotSettings, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import GraphBoard from '../graph/graph-board.svelte';

  let { question, labels }: ExerciseQuestionRendererProps = $props();

  const settings = $derived(readGraphPlotSettings(question.settings));
</script>

<div class="ui:space-y-1">
  {#if settings.expected.length > 0}
    <GraphBoard board={settings.board} elements={settings.expected} {labels} />
  {:else}
    <p class="ui:text-muted-foreground ui:text-sm">{getMathQuestionLabel(labels, 'math.graph.preview.empty')}</p>
  {/if}
</div>
