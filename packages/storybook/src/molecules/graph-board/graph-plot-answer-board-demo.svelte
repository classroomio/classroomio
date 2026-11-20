<script lang="ts">
  import type { PlotElement } from '@cio/question-types';
  import GraphPlotAnswerBoard from '@cio/ui/custom/exercise-question/renderers/graph/graph-plot-answer-board.svelte';

  let elements = $state.raw<PlotElement[]>([]);
</script>

<GraphPlotAnswerBoard
  board={{ xMin: -10, xMax: 10, yMin: -10, yMax: 10, grid: true, snap: 1, xLabel: 'x', yLabel: 'y' }}
  tools={['point', 'line', 'segment', 'parabola']}
  {elements}
  onElementsChange={(next) => (elements = next)}
/>
