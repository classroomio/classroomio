<script lang="ts">
  import {
    GRAPH_PLOT_TOOLS,
    getMathQuestionLabel,
    readGraphPlotSettings,
    type ExerciseQuestionRendererProps,
    type GraphPlotTool,
    type PlotElement
  } from '@cio/question-types';
  import { Checkbox } from '../../../../base/checkbox';
  import { Label } from '../../../../base/label';
  import { NumberField } from '../../../number-field';
  import GraphBoardFields from '../graph/graph-board-fields.svelte';
  import GraphPlotAnswerBoard from '../graph/graph-plot-answer-board.svelte';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getMathQuestionLabel>[1]) => getMathQuestionLabel(labels, key);

  const settings = $derived(readGraphPlotSettings(question.settings));
  let previewElements = $state.raw<PlotElement[]>([]);

  function patchSettings(patch: Record<string, unknown>) {
    onQuestionChange({ ...question, settings: { ...(question.settings ?? {}), ...patch } });
  }

  function toggleTool(tool: GraphPlotTool, isOn: boolean) {
    const next = isOn ? [...settings.tools, tool] : settings.tools.filter((current) => current !== tool);
    if (next.length === 0) return;

    patchSettings({ tools: GRAPH_PLOT_TOOLS.filter((current) => next.includes(current)) });
  }
</script>

<div class="ui:space-y-5" data-testid="graph-plot-edit">
  <div class="ui:space-y-3">
    <p class="ui:text-sm ui:font-medium">{label('math.graph.edit.board_heading')}</p>
    <GraphBoardFields settings={question.settings} {labels} {disabled} onPatchSettings={patchSettings} />
  </div>

  <div class="ui:space-y-2">
    <Label>{label('math.graph.plot.tools_label')}</Label>
    <div class="ui:flex ui:flex-wrap ui:gap-4">
      {#each GRAPH_PLOT_TOOLS as tool (tool)}
        <div class="ui:flex ui:items-center ui:gap-2">
          <Checkbox
            {disabled}
            checked={settings.tools.includes(tool)}
            onCheckedChange={(checked) => toggleTool(tool, checked === true)}
          />
          <Label>{label(`math.graph.tool.${tool}`)}</Label>
        </div>
      {/each}
    </div>
  </div>

  <div class="ui:max-w-xs ui:space-y-1">
    <Label>{label('math.graph.edit.tolerance_label')}</Label>
    <NumberField
      value={settings.tolerance}
      min={0}
      isDisabled={disabled}
      testId="graph-tolerance"
      onValueChange={(next) => next !== null && patchSettings({ tolerance: next })}
    />
    <p class="ui:text-muted-foreground ui:text-xs">{label('math.graph.edit.tolerance_helper')}</p>
  </div>

  <div class="ui:space-y-2" data-testid="graph-reference">
    <p class="ui:text-sm ui:font-medium">{label('math.graph.plot.reference_heading')}</p>
    <p class="ui:text-muted-foreground ui:text-xs">{label('math.graph.plot.reference_helper')}</p>
    <GraphPlotAnswerBoard
      board={settings.board}
      tools={[...GRAPH_PLOT_TOOLS]}
      elements={settings.expected}
      {labels}
      {disabled}
      onElementsChange={(next) => patchSettings({ expected: next })}
    />
    {#if settings.expected.length === 0}
      <p class="ui:text-destructive ui:text-xs">{label('math.graph.plot.reference_empty')}</p>
    {/if}
  </div>

  <div class="ui:space-y-2" data-testid="graph-student-preview">
    <p class="ui:text-sm ui:font-medium">{label('math.graph.plot.preview_heading')}</p>
    <p class="ui:text-muted-foreground ui:text-xs">{label('math.graph.plot.preview_helper')}</p>
    <GraphPlotAnswerBoard
      board={settings.board}
      tools={settings.tools}
      elements={previewElements}
      {labels}
      onElementsChange={(next) => (previewElements = next)}
    />
  </div>
</div>
