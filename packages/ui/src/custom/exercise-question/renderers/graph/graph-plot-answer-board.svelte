<script lang="ts">
  import {
    getMathQuestionLabel,
    type ExerciseQuestionLabels,
    type GraphBoardSettings,
    type GraphPlotTool,
    type MathQuestionLabelKey,
    type PlotElement
  } from '@cio/question-types';
  import GraphBoard from './graph-board.svelte';
  import GraphPlotToolbar from './graph-plot-toolbar.svelte';

  interface Props {
    board: GraphBoardSettings;
    tools: GraphPlotTool[];
    elements: PlotElement[];
    labels?: ExerciseQuestionLabels;
    disabled?: boolean;
    onElementsChange: (elements: PlotElement[]) => void;
  }

  let { board, tools, elements, labels, disabled = false, onElementsChange }: Props = $props();

  let selectedTool = $state<GraphPlotTool | null>(null);

  const tool = $derived(selectedTool && tools.includes(selectedTool) ? selectedTool : tools[0]);
  const hintKey = $derived(`math.graph.take.hint.${tool}` as MathQuestionLabelKey);
</script>

<div class="ui:space-y-2" data-testid="graph-plot-answer-board">
  {#if !disabled}
    <GraphPlotToolbar
      {tools}
      {tool}
      {labels}
      elementCount={elements.length}
      onToolChange={(next) => (selectedTool = next)}
      onUndo={() => onElementsChange(elements.slice(0, -1))}
      onClear={() => onElementsChange([])}
    />
    <p class="ui:text-muted-foreground ui:text-xs">{getMathQuestionLabel(labels, hintKey)}</p>
  {/if}
  <GraphBoard {board} {elements} {labels} tool={disabled ? null : tool} {onElementsChange} />
</div>
