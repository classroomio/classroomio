<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { renderCertificateDocument, type CertificateDesign, type CertificateRenderData } from '@cio/certificates';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import MaximizeIcon from '@lucide/svelte/icons/maximize';
  import { cn } from '../../tools';

  type ZoomMode = number | 'fit';

  interface Props {
    design: CertificateDesign;
    data: CertificateRenderData;
    zoom?: ZoomMode;
    showControls?: boolean;
    class?: string;
    /** The cert canvas is always 1100x780; tweak only if you need a different aspect. */
    width?: number;
    height?: number;
  }

  let {
    design,
    data,
    zoom = 'fit',
    showControls = false,
    class: className,
    width = 1100,
    height = 780
  }: Props = $props();

  const MIN_SCALE = 0.18;
  const MAX_SCALE = 1.5;

  let stageElement = $state<HTMLDivElement | null>(null);
  let iframeElement = $state<HTMLIFrameElement | null>(null);
  let manualScale = $state<number | null>(typeof zoom === 'number' ? clamp(zoom) : null);
  let fitScale = $state(0.4);

  const renderedHtml = $derived(renderCertificateDocument(design, data));

  $effect(() => {
    const html = renderedHtml;
    const doc = iframeElement?.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  });

  const isFit = $derived(zoom === 'fit' && manualScale == null);
  const scale = $derived(isFit ? fitScale : (manualScale ?? clamp(typeof zoom === 'number' ? zoom : 0.4)));

  function clamp(value: number): number {
    return Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
  }

  function recomputeFitScale() {
    if (!stageElement) return;

    const rect = stageElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const horizontal = rect.width / width;
    const vertical = rect.height / height;
    fitScale = clamp(Math.min(horizontal, vertical));
  }

  onMount(() => {
    if (!stageElement || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => untrack(recomputeFitScale));
    observer.observe(stageElement);
    recomputeFitScale();

    return () => observer.disconnect();
  });

  function handleZoomIn() {
    manualScale = clamp((manualScale ?? fitScale) + 0.1);
  }
  function handleZoomOut() {
    manualScale = clamp((manualScale ?? fitScale) - 0.1);
  }
  function handleFit() {
    manualScale = null;
    recomputeFitScale();
  }
</script>

<div
  bind:this={stageElement}
  class={cn('ui:relative ui:flex ui:h-full ui:w-full ui:items-center ui:justify-center ui:overflow-hidden', className)}
>
  <div class="ui:origin-center" style:width="{width}px" style:height="{height}px" style:transform="scale({scale})">
    <iframe
      bind:this={iframeElement}
      title="Certificate preview"
      sandbox="allow-same-origin"
      class="ui:h-full ui:w-full ui:rounded-sm ui:border-0 ui:shadow-[0_18px_40px_rgba(0,0,0,0.18),0_6px_12px_rgba(0,0,0,0.12)]"
      style:width="{width}px"
      style:height="{height}px"
    ></iframe>
  </div>

  {#if showControls}
    <div
      class="ui:absolute ui:bottom-3 ui:right-3 ui:flex ui:items-center ui:gap-1 ui:rounded-full ui:border ui:border-border ui:bg-card/95 ui:px-2 ui:py-1 ui:text-foreground ui:shadow-sm ui:backdrop-blur"
    >
      <button
        type="button"
        class="ui:flex ui:size-7 ui:items-center ui:justify-center ui:rounded-full ui:transition-colors ui:hover:bg-muted"
        aria-label="Zoom out"
        onclick={handleZoomOut}
      >
        <MinusIcon class="ui:size-3.5" />
      </button>
      <span class="ui:min-w-10 ui:text-center ui:text-[10px] ui:font-medium ui:tracking-wider">
        {Math.round(scale * 100)}%
      </span>
      <button
        type="button"
        class="ui:flex ui:size-7 ui:items-center ui:justify-center ui:rounded-full ui:transition-colors ui:hover:bg-muted"
        aria-label="Zoom in"
        onclick={handleZoomIn}
      >
        <PlusIcon class="ui:size-3.5" />
      </button>
      <button
        type="button"
        class="ui:flex ui:size-7 ui:items-center ui:justify-center ui:rounded-full ui:transition-colors ui:hover:bg-muted"
        aria-label="Fit to viewport"
        onclick={handleFit}
      >
        <MaximizeIcon class="ui:size-3.5" />
      </button>
    </div>
  {/if}
</div>
