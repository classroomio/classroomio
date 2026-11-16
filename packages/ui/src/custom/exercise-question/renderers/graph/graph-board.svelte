<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import {
    getMathQuestionLabel,
    parabolaFunction,
    snapGraphCoordinate,
    type ExerciseQuestionLabels,
    type GraphBoardSettings,
    type GraphCurve,
    type GraphLabelledPoint,
    type GraphPlotTool,
    type GraphPoint,
    type PlotElement
  } from '@cio/question-types';
  import { cn } from '../../../../tools';
  import {
    GRAPH_COLORS,
    PLOT_HANDLES,
    boardAspectRatio,
    buildPlotElement,
    clicksNeeded,
    moveHandle,
    readHandle,
    type PlotHandle
  } from './graph-board-utils';
  import { loadGraphFunctions, loadJsxGraph } from './jsxgraph-loader';
  import type { JsxBoard, JsxGraphApi, JsxObject, JsxPoint } from './jsxgraph-types';

  interface Props {
    board: GraphBoardSettings;
    /** The elements drawn on the board; with a `tool` the student can add to them and drag their points. */
    elements?: PlotElement[];
    /** A reference answer drawn dashed and fixed behind `elements`. */
    expected?: PlotElement[];
    curves?: GraphCurve[];
    markedPoints?: GraphLabelledPoint[];
    /** The tool that turns clicks into elements; leave it out for a board nobody draws on. */
    tool?: GraphPlotTool | null;
    /** Per element of `elements`, whether it matched the reference; colours it green or red. */
    matches?: boolean[];
    labels?: ExerciseQuestionLabels;
    ariaLabel?: string;
    class?: string;
    onElementsChange?: (elements: PlotElement[]) => void;
  }

  let {
    board,
    elements = [],
    expected = [],
    curves = [],
    markedPoints = [],
    tool = null,
    matches,
    labels,
    ariaLabel = '',
    class: className = '',
    onElementsChange = () => {}
  }: Props = $props();

  let container = $state<HTMLDivElement | null>(null);
  let jsx = $state.raw<JsxGraphApi | null>(null);
  let jsxBoard = $state.raw<JsxBoard | null>(null);
  let hasFailed = $state(false);
  let curveFunctions = $state.raw<Array<((x: number) => number) | null>>([]);
  let pendingClicks = $state.raw<GraphPoint[]>([]);
  let activeDraggable = new Set<JsxObject>();

  const boardKey = $derived(JSON.stringify(board));
  const aspectRatio = $derived(boardAspectRatio(board));
  const isInteractive = $derived(tool !== null);
  const isLoading = $derived(!jsxBoard && !hasFailed);

  onMount(() => {
    let isCurrent = true;
    loadJsxGraph()
      .then((api) => {
        if (isCurrent) jsx = api;
      })
      .catch(() => {
        if (isCurrent) hasFailed = true;
      });

    return () => {
      isCurrent = false;
    };
  });

  $effect(() => {
    if (!jsx || !container) return;

    const api = jsx;
    const node = container;
    const settings: GraphBoardSettings = untrack(() => JSON.parse(boardKey));
    const created = api.JSXGraph.initBoard(node, {
      boundingbox: [settings.xMin, settings.yMax, settings.xMax, settings.yMin],
      axis: true,
      grid: settings.grid,
      showCopyright: false,
      showNavigation: false,
      keepAspectRatio: false,
      pan: { enabled: false },
      zoom: { enabled: false },
      defaultAxes: {
        x: { name: settings.xLabel, withLabel: Boolean(settings.xLabel), label: { position: 'rt', offset: [-8, 14] } },
        y: { name: settings.yLabel, withLabel: Boolean(settings.yLabel), label: { position: 'rt', offset: [10, -8] } }
      }
    });
    created.on('down', handleBoardDown);
    jsxBoard = created;

    const observer = new ResizeObserver(() => {
      if (node.clientWidth === 0 || node.clientHeight === 0) return;

      created.resizeContainer(node.clientWidth, node.clientHeight, true, true);
      created.setBoundingBox([settings.xMin, settings.yMax, settings.xMax, settings.yMin], false);
      created.update();
    });
    observer.observe(node);

    return () => {
      observer.disconnect();
      jsxBoard = null;
      api.JSXGraph.freeBoard(created);
    };
  });

  $effect(() => {
    const sources = curves.map((curve) => curve.expression);
    let isCurrent = true;

    if (sources.length === 0) {
      curveFunctions = [];
      return;
    }

    void loadGraphFunctions().then(({ compileGraphFunction }) => {
      if (isCurrent) curveFunctions = sources.map((source) => compileGraphFunction(source));
    });

    return () => {
      isCurrent = false;
    };
  });

  $effect(() => {
    void tool;
    pendingClicks = [];
  });

  $effect(() => {
    if (!jsx || !jsxBoard) return;

    const api = jsx;
    const target = jsxBoard;
    const drawn: JsxObject[] = [];
    const draggable = new Set<JsxObject>();
    target.suspendUpdate();

    function createPoint(point: GraphPoint, attributes: Record<string, unknown>): JsxPoint {
      const created = target.create('point', [point.x, point.y], { name: '', ...attributes }) as JsxPoint;
      drawn.push(created);

      return created;
    }

    function createStroke(type: string, parents: unknown[], color: string, isExpected: boolean) {
      const created = target.create(type, parents, {
        strokeColor: color,
        strokeWidth: isExpected ? 2 : 3,
        dash: isExpected ? 2 : 0,
        strokeOpacity: isExpected ? 0.75 : 1,
        fixed: true,
        highlight: false,
        ...(type === 'line' ? { straightFirst: true, straightLast: true } : {})
      });
      drawn.push(created);
    }

    function drawElement(element: PlotElement, index: number, role: 'expected' | 'student') {
      const isExpected = role === 'expected';
      const isEditable = role === 'student' && isInteractive;
      const matched = role === 'student' ? matches?.[index] : undefined;
      const color = isExpected
        ? GRAPH_COLORS.expected
        : matched === undefined
          ? GRAPH_COLORS.student
          : matched
            ? GRAPH_COLORS.correct
            : GRAPH_COLORS.wrong;
      const pointAttributes = {
        size: isEditable ? 6 : isExpected ? 3 : 4,
        strokeColor: color,
        fillColor: isExpected ? 'white' : color,
        fixed: !isEditable,
        highlight: isEditable,
        showInfobox: isEditable,
        snapToGrid: isEditable && board.snap > 0,
        snapSizeX: board.snap,
        snapSizeY: board.snap
      };
      const handles = Object.fromEntries(
        PLOT_HANDLES[element.kind].map((handle) => [handle, createPoint(readHandle(element, handle), pointAttributes)])
      ) as Record<PlotHandle, JsxPoint>;

      if (element.kind === 'line' || element.kind === 'segment') {
        createStroke(element.kind, [handles.from, handles.to], color, isExpected);
      }
      if (element.kind === 'parabola') {
        const curve = (x: number) => {
          const compute = parabolaFunction(
            { x: handles.vertex.X(), y: handles.vertex.Y() },
            { x: handles.through.X(), y: handles.through.Y() }
          );

          return compute ? compute(x) : Number.NaN;
        };
        createStroke('functiongraph', [curve], color, isExpected);
      }

      if (!isEditable) return;

      for (const [handle, handlePoint] of Object.entries(handles) as Array<[PlotHandle, JsxPoint]>) {
        draggable.add(handlePoint);
        handlePoint.on('up', () => {
          const moved = {
            x: snapGraphCoordinate(handlePoint.X(), board.snap, board.xMin, board.xMax),
            y: snapGraphCoordinate(handlePoint.Y(), board.snap, board.yMin, board.yMax)
          };
          const original = readHandle(element, handle);
          if (moved.x === original.x && moved.y === original.y) return;

          onElementsChange(elements.map((current, i) => (i === index ? moveHandle(current, handle, moved) : current)));
        });
      }
    }

    expected.forEach((element, index) => drawElement(element, index, 'expected'));

    curves.forEach((_, index) => {
      const compute = curveFunctions[index];
      if (!compute) return;

      createStroke('functiongraph', [compute], GRAPH_COLORS.curves[index % GRAPH_COLORS.curves.length], false);
    });

    markedPoints.forEach((marked) => {
      createPoint(marked, {
        size: 4,
        fixed: true,
        highlight: false,
        strokeColor: GRAPH_COLORS.student,
        fillColor: GRAPH_COLORS.student,
        name: marked.label ?? '',
        withLabel: Boolean(marked.label),
        label: { offset: [8, 8] }
      });
    });

    elements.forEach((element, index) => drawElement(element, index, 'student'));

    pendingClicks.forEach((point) => {
      createPoint(point, {
        size: 5,
        fixed: true,
        highlight: false,
        strokeColor: GRAPH_COLORS.pending,
        fillColor: 'white'
      });
    });

    activeDraggable = draggable;
    target.unsuspendUpdate();

    return () => {
      activeDraggable = new Set();
      if (jsxBoard !== target) return;

      for (const object of drawn.reverse()) target.removeObject(object);
    };
  });

  function handleBoardDown(event: Event) {
    if (!tool || !jsx || !jsxBoard) return;
    if (jsxBoard.getAllObjectsUnderMouse(event).some((object) => activeDraggable.has(object))) return;

    const position = jsxBoard.getMousePosition(event);
    const [, x, y] = new jsx.Coords(jsx.COORDS_BY_SCREEN, position, jsxBoard).usrCoords;
    const snapped: GraphPoint = {
      x: snapGraphCoordinate(x, board.snap, board.xMin, board.xMax),
      y: snapGraphCoordinate(y, board.snap, board.yMin, board.yMax)
    };
    const clicks = [...pendingClicks, snapped];
    if (clicks.length < clicksNeeded(tool)) {
      pendingClicks = clicks;
      return;
    }

    const element = buildPlotElement(tool, clicks);
    pendingClicks = [];
    if (element) onElementsChange([...elements, element]);
  }
</script>

<div class={cn('ui:relative ui:w-full', aspectRatio >= 1 ? 'ui:max-w-[640px]' : 'ui:max-w-[420px]', className)}>
  <div
    bind:this={container}
    class="jxgbox ui:w-full ui:overflow-hidden ui:rounded-md ui:border ui:bg-white"
    style:aspect-ratio={aspectRatio}
    style:touch-action={isInteractive ? 'none' : 'auto'}
    role="img"
    aria-label={ariaLabel || getMathQuestionLabel(labels, 'math.graph.take.board_label')}
    data-testid="graph-board"
    data-ready={jsxBoard ? 'true' : 'false'}
  ></div>
  {#if isLoading}
    <div
      class="ui:text-muted-foreground ui:absolute ui:inset-0 ui:flex ui:items-center ui:justify-center ui:text-sm"
      data-testid="graph-board-loading"
    >
      {getMathQuestionLabel(labels, 'math.graph.take.loading')}
    </div>
  {:else if hasFailed}
    <div
      class="ui:text-destructive ui:absolute ui:inset-0 ui:flex ui:items-center ui:justify-center ui:text-sm"
      role="alert"
    >
      {getMathQuestionLabel(labels, 'math.graph.take.failed')}
    </div>
  {/if}
</div>

<style>
  :global(.jxgbox) {
    position: relative;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  :global(.jxgbox svg) {
    display: block;
  }
  :global(.JXGtext) {
    font-family: inherit;
    font-size: 12px;
    color: #334155;
  }
  :global(.JXGinfobox) {
    font-size: 11px;
  }
</style>
