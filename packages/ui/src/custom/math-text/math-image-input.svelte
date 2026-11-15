<script lang="ts">
  import { onDestroy } from 'svelte';
  import CameraIcon from '@lucide/svelte/icons/camera';
  import EraserIcon from '@lucide/svelte/icons/eraser';
  import ImageUpIcon from '@lucide/svelte/icons/image-up';
  import { Button } from '../../base/button';
  import MathInput from '../math-input/math-input.svelte';
  import type { MathKeyboard } from '../math-input/types';
  import type { MathImageConverter, MathImagePayload, MathImageSource } from './math-image';
  import {
    drawingToPayload,
    imageToPayload,
    isParsableMath,
    loadImage,
    MATH_IMAGE_FILE_TYPES,
    MATH_IMAGE_MAX_FILE_BYTES,
    normaliseCrop,
    pickImageFile,
    type CropRect
  } from './math-image-utils';

  interface Props {
    mode: MathImageSource;
    converter: MathImageConverter;
    keyboard?: MathKeyboard;
    /** Called with the reviewed LaTeX when the user clicks Insert. */
    onInsert: (latex: string) => void;
  }

  let { mode, converter, keyboard = 'full', onInsert }: Props = $props();

  const labels = $derived(converter.labels);
  const DRAW_PAUSE_MS = 1200;
  const REVALIDATE_MS = 300;
  const MIN_CROP_FRACTION = 0.03;
  const INK_WIDTH = 3;

  let latex = $state('');
  let isConverting = $state(false);
  let isValid = $state(false);
  let hasResult = $state(false);
  let message = $state('');

  let fileInput = $state<HTMLInputElement | null>(null);
  let cameraInput = $state<HTMLInputElement | null>(null);
  let imageUrl = $state('');
  let imageElement = $state.raw<HTMLImageElement | null>(null);
  let displayedImage = $state<HTMLImageElement | null>(null);
  let crop = $state<CropRect | null>(null);
  let cropStart: { x: number; y: number } | null = null;

  let drawCanvas = $state<HTMLCanvasElement | null>(null);
  let hasInk = $state(false);
  let drawTimer: ReturnType<typeof setTimeout> | undefined;
  let lastPoint: { x: number; y: number } | null = null;

  let revalidateTimer: ReturnType<typeof setTimeout> | undefined;
  let conversionId = 0;

  function resetResult() {
    conversionId += 1;
    isConverting = false;
    hasResult = false;
    isValid = false;
    message = '';
    latex = '';
  }

  async function runConversion(payload: MathImagePayload) {
    conversionId += 1;
    const currentId = conversionId;
    isConverting = true;
    message = '';

    try {
      const result = await converter.convert(payload, mode);
      if (currentId !== conversionId) return;

      latex = result.latex;
      isValid = result.valid;
      hasResult = true;
      message = result.valid ? '' : result.latex ? labels.parseFailed : labels.noMathFound;
    } catch (error) {
      if (currentId !== conversionId) return;

      hasResult = false;
      message = error instanceof Error && error.message ? error.message : labels.conversionFailed;
    } finally {
      if (currentId === conversionId) isConverting = false;
    }
  }

  function handleLatexEdit(nextLatex: string) {
    clearTimeout(revalidateTimer);
    message = '';
    revalidateTimer = setTimeout(async () => {
      const edited = nextLatex.trim();
      const valid = edited ? await isParsableMath(edited) : false;
      if (edited !== latex.trim()) return;

      isValid = valid;
      message = valid || !edited ? '' : labels.invalidMath;
    }, REVALIDATE_MS);
  }

  function insert() {
    if (!isValid) return;

    onInsert(latex.trim());
  }

  async function loadFile(file: File) {
    if (!MATH_IMAGE_FILE_TYPES.includes(file.type)) {
      message = labels.unsupportedFile;
      return;
    }
    if (file.size > MATH_IMAGE_MAX_FILE_BYTES) {
      message = labels.imageTooLarge;
      return;
    }

    resetResult();
    crop = null;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = URL.createObjectURL(file);
    imageElement = await loadImage(imageUrl);
  }

  function handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = pickImageFile(input.files);
    input.value = '';
    if (file) void loadFile(file);
  }

  function handlePaste(event: ClipboardEvent) {
    if (mode !== 'photo') return;

    const file = pickImageFile(event.clipboardData?.files);
    if (!file) return;

    event.preventDefault();
    void loadFile(file);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const file = pickImageFile(event.dataTransfer?.files);
    if (file) void loadFile(file);
  }

  function pointInImage(event: PointerEvent) {
    const bounds = displayedImage!.getBoundingClientRect();

    return { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height };
  }

  function startCrop(event: PointerEvent) {
    if (!displayedImage) return;

    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    cropStart = pointInImage(event);
    crop = null;
  }

  function moveCrop(event: PointerEvent) {
    if (!cropStart || !displayedImage) return;

    const point = pointInImage(event);
    crop = normaliseCrop(cropStart.x, cropStart.y, point.x, point.y);
  }

  function endCrop() {
    cropStart = null;
    if (crop && (crop.width < MIN_CROP_FRACTION || crop.height < MIN_CROP_FRACTION)) crop = null;
  }

  function convertPhoto() {
    if (!imageElement) return;

    void runConversion(imageToPayload(imageElement, crop));
  }

  function prepareCanvas() {
    if (!drawCanvas) return;

    const ratio = window.devicePixelRatio || 1;
    drawCanvas.width = drawCanvas.clientWidth * ratio;
    drawCanvas.height = drawCanvas.clientHeight * ratio;
    const context = drawCanvas.getContext('2d')!;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
    context.strokeStyle = '#111111';
    context.lineWidth = INK_WIDTH * ratio;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    hasInk = false;
  }

  function canvasPoint(event: PointerEvent) {
    const bounds = drawCanvas!.getBoundingClientRect();
    const ratio = drawCanvas!.width / bounds.width;

    return { x: (event.clientX - bounds.left) * ratio, y: (event.clientY - bounds.top) * ratio };
  }

  function startStroke(event: PointerEvent) {
    if (!drawCanvas) return;

    event.preventDefault();
    clearTimeout(drawTimer);
    drawCanvas.focus();
    drawCanvas.setPointerCapture(event.pointerId);
    lastPoint = canvasPoint(event);
    const context = drawCanvas.getContext('2d')!;
    context.beginPath();
    context.arc(lastPoint.x, lastPoint.y, context.lineWidth / 2, 0, Math.PI * 2);
    context.fillStyle = '#111111';
    context.fill();
    hasInk = true;
  }

  function continueStroke(event: PointerEvent) {
    if (!drawCanvas || !lastPoint) return;

    const point = canvasPoint(event);
    const context = drawCanvas.getContext('2d')!;
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPoint = point;
  }

  function endStroke() {
    if (!lastPoint || !drawCanvas) return;

    lastPoint = null;
    clearTimeout(drawTimer);
    drawTimer = setTimeout(() => {
      if (drawCanvas) void runConversion(drawingToPayload(drawCanvas));
    }, DRAW_PAUSE_MS);
  }

  function clearDrawing() {
    clearTimeout(drawTimer);
    resetResult();
    prepareCanvas();
  }

  $effect(() => {
    if (mode !== 'draw' || !drawCanvas) return;

    const observer = new ResizeObserver(() => {
      if (!hasInk) prepareCanvas();
    });
    observer.observe(drawCanvas);

    return () => observer.disconnect();
  });

  onDestroy(() => {
    clearTimeout(drawTimer);
    clearTimeout(revalidateTimer);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  });
</script>

<svelte:document onpaste={handlePaste} />

{#snippet review()}
  <div class="ui:space-y-2">
    <p class="ui:text-xs ui:font-medium ui:text-muted-foreground">{labels.converted}</p>
    <MathInput
      bind:value={latex}
      {keyboard}
      ariaLabel={labels.converted}
      onInput={(value) => handleLatexEdit(value.latex)}
      onSubmit={insert}
    />
    {#if message}
      <p class="ui:text-xs ui:text-destructive" role="alert">{message}</p>
    {/if}
    <div class="ui:flex ui:justify-end">
      <Button type="button" size="sm" disabled={!isValid || isConverting} onclick={insert}>{labels.insert}</Button>
    </div>
  </div>
{/snippet}

{#if mode === 'photo'}
  <div class="ui:space-y-3" role="group" ondragover={(event) => event.preventDefault()} ondrop={handleDrop}>
    <input
      bind:this={fileInput}
      type="file"
      accept={MATH_IMAGE_FILE_TYPES.join(',')}
      class="ui:hidden"
      onchange={handleFileChange}
    />
    <input
      bind:this={cameraInput}
      type="file"
      accept="image/*"
      capture="environment"
      class="ui:hidden"
      onchange={handleFileChange}
    />

    {#if !imageUrl}
      <div
        class="ui:flex ui:flex-col ui:items-center ui:gap-3 ui:rounded-md ui:border ui:border-dashed ui:px-4 ui:py-6 ui:text-center"
      >
        <p class="ui:text-sm ui:text-muted-foreground">{labels.photoHint}</p>
        <div class="ui:flex ui:flex-wrap ui:justify-center ui:gap-2">
          <Button type="button" variant="outline" size="sm" onclick={() => fileInput?.click()}>
            <ImageUpIcon class="ui:size-4" />
            {labels.upload}
          </Button>
          <Button type="button" variant="outline" size="sm" onclick={() => cameraInput?.click()}>
            <CameraIcon class="ui:size-4" />
            {labels.takePhoto}
          </Button>
        </div>
      </div>
    {:else}
      <div class="ui:grid ui:gap-3 ui:sm:grid-cols-2">
        <div class="ui:space-y-2">
          <p class="ui:text-xs ui:font-medium ui:text-muted-foreground">{labels.original}</p>
          <div
            class="ui:relative ui:touch-none ui:select-none ui:overflow-hidden ui:rounded-md ui:border ui:bg-white ui:cursor-crosshair"
            role="presentation"
            onpointerdown={startCrop}
            onpointermove={moveCrop}
            onpointerup={endCrop}
            onpointercancel={endCrop}
          >
            <img
              bind:this={displayedImage}
              src={imageUrl}
              alt={labels.original}
              class="ui:block ui:max-h-56 ui:w-full ui:object-contain"
              draggable="false"
            />
            {#if crop}
              <div
                class="ui:pointer-events-none ui:absolute ui:border-2 ui:border-primary ui:bg-primary/10"
                style="left:{crop.x * 100}%;top:{crop.y * 100}%;width:{crop.width * 100}%;height:{crop.height * 100}%"
              ></div>
            {/if}
          </div>
          <p class="ui:text-xs ui:text-muted-foreground">{labels.cropHint}</p>
          <div class="ui:flex ui:flex-wrap ui:gap-2">
            <Button type="button" size="sm" disabled={isConverting} onclick={convertPhoto}>
              {isConverting ? labels.converting : labels.convert}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={!crop} onclick={() => (crop = null)}
              >{labels.resetCrop}</Button
            >
            <Button type="button" variant="outline" size="sm" onclick={() => fileInput?.click()}>
              <ImageUpIcon class="ui:size-4" />
              {labels.upload}
            </Button>
          </div>
        </div>
        <div>
          {#if hasResult}
            {@render review()}
          {:else if isConverting}
            <p class="ui:text-sm ui:text-muted-foreground" aria-live="polite">{labels.converting}</p>
          {:else if message}
            <p class="ui:text-xs ui:text-destructive" role="alert">{message}</p>
          {/if}
        </div>
      </div>
    {/if}
    {#if !imageUrl && message}
      <p class="ui:text-xs ui:text-destructive" role="alert">{message}</p>
    {/if}
  </div>
{:else}
  <div class="ui:space-y-3">
    <canvas
      bind:this={drawCanvas}
      class="ui:h-40 ui:w-full ui:select-none ui:touch-none ui:rounded-md ui:border ui:bg-white ui:cursor-crosshair"
      aria-label={labels.drawHint}
      tabindex="-1"
      onpointerdown={startStroke}
      onpointermove={continueStroke}
      onpointerup={endStroke}
      onpointercancel={endStroke}
    ></canvas>
    <div class="ui:flex ui:items-center ui:justify-between ui:gap-2">
      <p class="ui:text-xs ui:text-muted-foreground">{isConverting ? labels.converting : labels.drawHint}</p>
      <Button type="button" variant="outline" size="sm" disabled={!hasInk} onclick={clearDrawing}>
        <EraserIcon class="ui:size-4" />
        {labels.clear}
      </Button>
    </div>
    {#if hasResult}
      {@render review()}
    {:else if message}
      <p class="ui:text-xs ui:text-destructive" role="alert">{message}</p>
    {/if}
  </div>
{/if}
