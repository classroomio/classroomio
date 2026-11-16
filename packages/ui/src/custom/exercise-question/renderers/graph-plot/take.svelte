<script lang="ts">
  import { readGraphPlotSettings, type ExerciseQuestionRendererProps, type PlotElement } from '@cio/question-types';
  import GraphPlotAnswerBoard from '../graph/graph-plot-answer-board.svelte';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const settings = $derived(readGraphPlotSettings(question.settings));
  const elements = $derived(answer?.type === 'GRAPH_PLOT' ? answer.elements : []);

  function handleElementsChange(next: PlotElement[]) {
    onAnswerChange(next.length > 0 ? { type: 'GRAPH_PLOT', elements: next } : null);
  }
</script>

<GraphPlotAnswerBoard
  board={settings.board}
  tools={settings.tools}
  {elements}
  {labels}
  {disabled}
  onElementsChange={handleElementsChange}
/>
