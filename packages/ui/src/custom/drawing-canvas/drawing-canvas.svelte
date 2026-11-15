<script lang="ts">
  import { onMount } from 'svelte';
  import EraserIcon from '@lucide/svelte/icons/eraser';
  import Undo2Icon from '@lucide/svelte/icons/undo-2';
  import { Button } from '../../base/button';
  import { cn } from '../../tools';
  import { DEFAULT_DRAWING_CANVAS_LABELS, type DrawingCanvasLabels } from './types';

  type Point = { x: number; y: number };

  interface Props {
    /** Called with the drawing as a PNG file when the user saves it. May return a promise while it uploads. */
    onSave: (file: File) => void | Promise<void>;
    labels?: DrawingCanvasLabels;
    disabled?: boolean;
    /** File name of the exported PNG. */
    fileName?: string;
    height?: number;
    class?: string;
  }

  let {
    onSave,
    labels = DEFAULT_DRAWING_CANVAS_LABELS,
    disabled = false,
    fileName = 'drawing.png',
    height = 280,
    class: className = ''
  }: Props = $props();

  const STROKE_WIDTH = 3;

  let canvasElement = $state<HTMLCanvasElement | null>(null);
  let wrapperElement = $state<HTMLElement | null>(null);
  let strokes = $state.raw<Point[][]>([]);
  let activeStroke: Point[] | null = null;
  let isSaving = $state(false);

  const hasDrawing = $derived(strokes.length > 0);

  function getContext() {
    return canvasElement?.getContext('2d') ?? null;
  }

  function paintStroke(context: CanvasRenderingContext2D, stroke: Point[]) {
    if (stroke.length === 0) return;

    context.beginPath();
    context.moveTo(stroke[0].x, stroke[0].y);
    if (stroke.length === 1) context.lineTo(stroke[0].x + 0.01, stroke[0].y);
    for (const point of stroke.slice(1)) context.lineTo(point.x, point.y);
    context.stroke();
  }

  function repaint() {
    const context = getContext();
    if (!context || !canvasElement) return;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvasElement.width, canvasElement.height);
    context.restore();

    context.lineWidth = STROKE_WIDTH;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#111827';
    for (const stroke of strokes) paintStroke(context, stroke);
  }

  function resizeCanvas() {
    if (!canvasElement || !wrapperElement) return;

    const ratio = window.devicePixelRatio || 1;
    const width = wrapperElement.clientWidth;
    canvasElement.width = Math.max(1, Math.floor(width * ratio));
    canvasElement.height = Math.floor(height * ratio);
    canvasElement.style.height = `${height}px`;
    getContext()?.setTransform(ratio, 0, 0, ratio, 0, 0);
    repaint();
  }

  function toPoint(event: PointerEvent): Point {
    const bounds = canvasElement!.getBoundingClientRect();

    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function handlePointerDown(event: PointerEvent) {
    if (disabled || !canvasElement) return;

    canvasElement.setPointerCapture(event.pointerId);
    activeStroke = [toPoint(event)];
    strokes = [...strokes, activeStroke];
    repaint();
  }

  function handlePointerMove(event: PointerEvent) {
    if (!activeStroke) return;

    activeStroke.push(toPoint(event));
    repaint();
  }

  function handlePointerUp() {
    activeStroke = null;
  }

  function undo() {
    strokes = strokes.slice(0, -1);
    repaint();
  }

  function clear() {
    strokes = [];
    repaint();
  }

  async function save() {
    if (!canvasElement || !hasDrawing || isSaving) return;

    const blob = await new Promise<Blob | null>((resolve) => canvasElement!.toBlob(resolve, 'image/png'));
    if (!blob) return;

    isSaving = true;
    try {
      await onSave(new File([blob], fileName, { type: 'image/png' }));
      clear();
    } finally {
      isSaving = false;
    }
  }

  onMount(() => {
    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    if (wrapperElement) observer.observe(wrapperElement);

    return () => observer.disconnect();
  });
</script>

<div class={cn('ui:space-y-2', className)} data-slot="drawing-canvas">
  <div bind:this={wrapperElement} class="ui:border-input ui:overflow-hidden ui:rounded-md ui:border ui:bg-white">
    <canvas
      bind:this={canvasElement}
      class="ui:block ui:w-full ui:touch-none ui:cursor-crosshair"
      role="img"
      aria-label={labels.canvas}
      onpointerdown={handlePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointercancel={handlePointerUp}
    ></canvas>
  </div>
  <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-2">
    <Button type="button" variant="outline" size="sm" disabled={disabled || !hasDrawing} onclick={undo}>
      <Undo2Icon class="ui:mr-1 ui:size-4" />
      {labels.undo}
    </Button>
    <Button type="button" variant="outline" size="sm" disabled={disabled || !hasDrawing} onclick={clear}>
      <EraserIcon class="ui:mr-1 ui:size-4" />
      {labels.clear}
    </Button>
    <Button type="button" size="sm" class="ui:ml-auto" disabled={disabled || !hasDrawing || isSaving} onclick={save}>
      {isSaving ? labels.saving : labels.save}
    </Button>
  </div>
</div>
