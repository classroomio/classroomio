<script lang="ts">
  import {
    getMathQuestionLabel,
    type ExerciseQuestionLabels,
    type GraphPlotTool,
    type MathQuestionLabelKey
  } from '@cio/question-types';
  import DotIcon from '@lucide/svelte/icons/dot';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import SlashIcon from '@lucide/svelte/icons/slash';
  import SplineIcon from '@lucide/svelte/icons/spline';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import Undo2Icon from '@lucide/svelte/icons/undo-2';
  import type { Component } from 'svelte';
  import { Button } from '../../../../base/button';

  interface Props {
    tools: GraphPlotTool[];
    tool: GraphPlotTool;
    elementCount: number;
    labels?: ExerciseQuestionLabels;
    disabled?: boolean;
    onToolChange: (tool: GraphPlotTool) => void;
    onUndo: () => void;
    onClear: () => void;
  }

  let { tools, tool, elementCount, labels, disabled = false, onToolChange, onUndo, onClear }: Props = $props();

  const label = (key: MathQuestionLabelKey) => getMathQuestionLabel(labels, key);

  const TOOL_ICONS: Record<GraphPlotTool, Component> = {
    point: DotIcon,
    line: SlashIcon,
    segment: MinusIcon,
    parabola: SplineIcon
  };
</script>

<div class="ui:flex ui:flex-wrap ui:items-center ui:gap-2" role="toolbar" data-testid="graph-plot-toolbar">
  {#each tools as availableTool (availableTool)}
    {@const Icon = TOOL_ICONS[availableTool]}
    <Button
      type="button"
      size="sm"
      variant={tool === availableTool ? 'default' : 'outline'}
      {disabled}
      aria-pressed={tool === availableTool}
      data-testid={`graph-tool-${availableTool}`}
      onclick={() => onToolChange(availableTool)}
    >
      <Icon class="ui:mr-1 ui:size-4" />
      {label(`math.graph.tool.${availableTool}`)}
    </Button>
  {/each}
  <span class="ui:ml-auto ui:flex ui:gap-2">
    <Button
      type="button"
      size="sm"
      variant="secondary"
      disabled={disabled || elementCount === 0}
      data-testid="graph-undo"
      onclick={onUndo}
    >
      <Undo2Icon class="ui:mr-1 ui:size-4" />
      {label('math.graph.take.undo')}
    </Button>
    <Button
      type="button"
      size="sm"
      variant="secondary"
      disabled={disabled || elementCount === 0}
      data-testid="graph-clear"
      onclick={onClear}
    >
      <Trash2Icon class="ui:mr-1 ui:size-4" />
      {label('math.graph.take.clear')}
    </Button>
  </span>
</div>
