<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import type { GraphPlotTool, PlotElement } from '@cio/question-types';
  import GraphBoard from '@cio/ui/custom/exercise-question/renderers/graph/graph-board.svelte';
  import GraphGradeResult from '@cio/ui/custom/exercise-question/renderers/graph/graph-grade-result.svelte';
  import GraphLegend from '@cio/ui/custom/exercise-question/renderers/graph/graph-legend.svelte';
  import GraphPlotAnswerBoard from '@cio/ui/custom/exercise-question/renderers/graph/graph-plot-answer-board.svelte';
  import GraphPlotToolbar from '@cio/ui/custom/exercise-question/renderers/graph/graph-plot-toolbar.svelte';
  import { MATH_QUESTION_LABEL_DEFAULTS } from '@cio/question-types';
  import { FIELDS } from './fields';
  import GraphPlotAnswerBoardDemo from './graph-plot-answer-board-demo.svelte';

  const { Story } = defineMeta({
    title: 'Molecules/GraphBoard',
    component: GraphBoard,
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onElementsChange: { control: false },
      labels: { control: false }
    },
    tags: ['autodocs']
  });

  const DEFAULT_BOARD = { xMin: -10, xMax: 10, yMin: -10, yMax: 10, grid: true, snap: 1, xLabel: 'x', yLabel: 'y' };
  const SMALL_BOARD = { ...DEFAULT_BOARD, xMin: -6, xMax: 6, yMin: -6, yMax: 6 };

  const LINE: PlotElement = { kind: 'line', from: { x: -2, y: -4 }, to: { x: 2, y: 4 } };
  const POINT: PlotElement = { kind: 'point', x: 3, y: 1 };
  const PARABOLA: PlotElement = { kind: 'parabola', vertex: { x: 0, y: -4 }, through: { x: 2, y: 0 } };
  const SEGMENT: PlotElement = { kind: 'segment', from: { x: -5, y: 2 }, to: { x: -1, y: 5 } };
  const ALL_TOOLS: GraphPlotTool[] = ['point', 'line', 'segment', 'parabola'];
</script>

<Story name="Empty board" args={{ board: DEFAULT_BOARD }} />

<Story name="Plot with every element" args={{ board: SMALL_BOARD, elements: [LINE, POINT, PARABOLA, SEGMENT] }} />

<Story name="Without grid" args={{ board: { ...DEFAULT_BOARD, grid: false }, elements: [LINE] }} />

<Story
  name="Custom range and labels"
  args={{
    board: { xMin: 0, xMax: 20, yMin: 0, yMax: 100, grid: true, snap: 5, xLabel: 't', yLabel: 'd' },
    elements: [{ kind: 'line', from: { x: 0, y: 10 }, to: { x: 10, y: 60 } }]
  }}
/>

<Story
  name="Reference overlay with correct and wrong elements"
  args={{
    board: SMALL_BOARD,
    expected: [LINE, PARABOLA],
    elements: [LINE, { kind: 'point', x: 3, y: 3 }],
    matches: [true, false]
  }}
/>

<Story
  name="Reading a function and marked points"
  args={{
    board: SMALL_BOARD,
    curves: [{ expression: 'x^2-4', label: 'f' }, { expression: '\\frac{x}{2}+1' }],
    markedPoints: [
      { x: 2, y: 0, label: 'A' },
      { x: -2, y: 0, label: 'B' }
    ]
  }}
/>

<Story name="Interactive plotting" parameters={{ controls: { disable: true } }}>
  {#snippet template()}
    <GraphPlotAnswerBoardDemo />
  {/snippet}
</Story>

<Story name="Toolbar with every tool" parameters={{ controls: { disable: true } }}>
  {#snippet template()}
    <GraphPlotToolbar
      tools={ALL_TOOLS}
      tool="line"
      elementCount={2}
      labels={MATH_QUESTION_LABEL_DEFAULTS}
      onToolChange={() => {}}
      onUndo={() => {}}
      onClear={() => {}}
    />
  {/snippet}
</Story>

<Story name="Toolbar with two tools and nothing drawn" parameters={{ controls: { disable: true } }}>
  {#snippet template()}
    <GraphPlotToolbar
      tools={['point', 'line']}
      tool="point"
      elementCount={0}
      labels={MATH_QUESTION_LABEL_DEFAULTS}
      onToolChange={() => {}}
      onUndo={() => {}}
      onClear={() => {}}
    />
  {/snippet}
</Story>

<Story name="Disabled answer board" parameters={{ controls: { disable: true } }}>
  {#snippet template()}
    <GraphPlotAnswerBoard
      board={SMALL_BOARD}
      tools={ALL_TOOLS}
      elements={[LINE, POINT]}
      disabled
      onElementsChange={() => {}}
    />
  {/snippet}
</Story>

<Story name="Grade results" parameters={{ controls: { disable: true } }}>
  {#snippet template()}
    <div class="max-w-md space-y-2">
      <GraphGradeResult reason="correct" matched={2} total={2} showCount />
      <GraphGradeResult reason="partial" matched={1} total={2} showCount />
      <GraphGradeResult reason="extra" matched={2} total={2} showCount />
      <GraphGradeResult reason="wrong" matched={0} total={2} showCount />
      <GraphGradeResult reason="missing" />
      <GraphGradeResult reason="not_set" />
    </div>
  {/snippet}
</Story>

<Story name="Legend" parameters={{ controls: { disable: true } }}>
  {#snippet template()}
    <GraphLegend />
  {/snippet}
</Story>
