<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Certificate } from '@cio/ui';
  import { Button } from '@cio/ui/base/button';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import LayoutIcon from '@lucide/svelte/icons/layout';
  import SquareIcon from '@lucide/svelte/icons/square';
  import TypeIcon from '@lucide/svelte/icons/type';
  import AwardIcon from '@lucide/svelte/icons/award';
  import HashIcon from '@lucide/svelte/icons/hash';
  import PenToolIcon from '@lucide/svelte/icons/pen-tool';
  import PaletteIcon from '@lucide/svelte/icons/palette';
  import ZoomInIcon from '@lucide/svelte/icons/zoom-in';
  import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
  import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
  import { t } from '$lib/utils/functions/translations';
  import type { CertificateDesign, CertificateRenderData } from '@cio/certificates';
  import type { ToolCategory, StudioElementId, ResizeDirection } from '../types';
  import CanvasElementZone from './canvas-element-zone.svelte';

  interface Props {
    design: CertificateDesign;
    previewData: CertificateRenderData;
    zoom: number;
    selectedTool: ToolCategory;
    selectedElement?: StudioElementId | null;
    onSelectTool: (tool: ToolCategory) => void;
    onSelectElement?: (element: StudioElementId | null) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFit: () => void;
    stageElement?: HTMLDivElement | null;
  }

  let {
    design,
    previewData,
    zoom,
    selectedTool,
    selectedElement = null,
    onSelectTool,
    onSelectElement = () => {},
    onZoomIn,
    onZoomOut,
    onFit,
    stageElement = $bindable(null)
  }: Props = $props();

  let canvasContainer = $state<HTMLDivElement | null>(null);
  let hoveredZone = $state<StudioElementId | null>(null);

  interface ElementRect {
    left: number;
    top: number;
    width: number;
    height: number;
  }

  type ElementRects = Partial<Record<StudioElementId, ElementRect>>;

  let measuredRects = $state<ElementRects>({});

  const elementsConfig = $derived(design.elements ?? {});

  const CALIBRATED_FALLBACKS: Record<StudioElementId, ElementRect> = {
    header: { left: 160, top: 45, width: 780, height: 35 },
    title: { left: 140, top: 90, width: 820, height: 95 },
    subtitle: { left: 160, top: 155, width: 780, height: 35 },
    recipient: { left: 160, top: 210, width: 780, height: 95 },
    course: { left: 160, top: 320, width: 780, height: 50 },
    description: { left: 160, top: 375, width: 780, height: 60 },
    date: { left: 350, top: 450, width: 400, height: 30 },
    badge: { left: 495, top: 580, width: 110, height: 110 },
    'signatory-0': { left: 170, top: 585, width: 220, height: 110 },
    'signatory-1': { left: 710, top: 585, width: 220, height: 110 },
    'signatory-2': { left: 440, top: 585, width: 220, height: 110 },
    signatories: { left: 110, top: 575, width: 880, height: 130 },
    qrCode: { left: 915, top: 690, width: 155, height: 60 },
    border: { left: 12, top: 12, width: 1076, height: 756 },
    background: { left: 0, top: 0, width: 1100, height: 780 }
  };

  function getRect(id: StudioElementId): ElementRect {
    const custom = elementsConfig[id];
    if (custom?.positionMode === 'custom' && custom.x != null && custom.y != null) {
      const measured = measuredRects[id];
      return {
        left: custom.x,
        top: custom.y,
        width: custom.width ?? measured?.width ?? CALIBRATED_FALLBACKS[id]?.width ?? 120,
        height: custom.height ?? measured?.height ?? CALIBRATED_FALLBACKS[id]?.height ?? 40
      };
    }
    if (measuredRects[id]) {
      return measuredRects[id]!;
    }
    return CALIBRATED_FALLBACKS[id] ?? { left: 100, top: 100, width: 200, height: 50 };
  }

  function measureIframeElements() {
    if (!canvasContainer) return;
    const iframe = canvasContainer.querySelector('iframe');
    const doc = iframe?.contentDocument;
    if (!doc) return;

    const cert = doc.querySelector('.t-modular') || doc.body;
    if (!cert) return;
    const certRect = cert.getBoundingClientRect();
    if (certRect.width === 0 || certRect.height === 0) return;

    const next: ElementRects = {};
    const domElements = doc.querySelectorAll<HTMLElement>('[data-certificate-element]');

    domElements.forEach((el) => {
      const elId = el.getAttribute('data-certificate-element') as StudioElementId;
      if (!elId) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        next[elId] = {
          left: Math.round(r.left - certRect.left),
          top: Math.round(r.top - certRect.top),
          width: Math.round(r.width),
          height: Math.round(r.height)
        };
      }
    });

    measuredRects = next;
  }

  $effect(() => {
    // Read reactive design and previewData to trigger updates
    const currentDesign = JSON.stringify(design);
    const currentPreviewData = JSON.stringify(previewData);
    void currentDesign;
    void currentPreviewData;

    const rafId = requestAnimationFrame(() => {
      measureIframeElements();
    });
    const timerId = setTimeout(measureIframeElements, 60);
    const timerId2 = setTimeout(measureIframeElements, 250);

    if (canvasContainer) {
      const iframe = canvasContainer.querySelector('iframe');
      const doc = iframe?.contentDocument;
      if (doc?.fonts?.ready) {
        doc.fonts.ready.then(measureIframeElements).catch(() => {});
      }
    }

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      clearTimeout(timerId2);
    };
  });

  // 2D Pointer Dragging State & Snapping Guides
  interface DragState {
    elementId: StudioElementId;
    startPointerX: number;
    startPointerY: number;
    startElemX: number;
    startElemY: number;
    elemWidth: number;
    elemHeight: number;
    pointerId: number;
    captureTarget: HTMLElement;
  }

  interface ResizeState {
    elementId: StudioElementId;
    direction: ResizeDirection;
    startPointerX: number;
    startPointerY: number;
    startElemX: number;
    startElemY: number;
    startElemWidth: number;
    startElemHeight: number;
    pointerId: number;
    captureTarget: HTMLElement;
    preserveAspect: boolean;
  }

  let dragState = $state<DragState | null>(null);
  let resizeState = $state<ResizeState | null>(null);
  let snapGuideX = $state<number | null>(null);
  let snapGuideY = $state<number | null>(null);

  function handleStartDrag(e: PointerEvent, id: StudioElementId) {
    if (e.button !== 0 || dragState || resizeState) return;

    const rect = getRect(id);
    const custom = elementsConfig[id];
    const startX = custom?.positionMode === 'custom' && custom.x != null ? custom.x : rect.left;
    const startY = custom?.positionMode === 'custom' && custom.y != null ? custom.y : rect.top;

    dragState = {
      elementId: id,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startElemX: startX,
      startElemY: startY,
      elemWidth: rect.width || 120,
      elemHeight: rect.height || 40,
      pointerId: e.pointerId,
      captureTarget: e.currentTarget as HTMLElement
    };

    onSelectElement(id);
    dragState.captureTarget.setPointerCapture(e.pointerId);
  }

  function handleStartResize(e: PointerEvent, id: StudioElementId, direction: ResizeDirection) {
    if (e.button !== 0 || dragState || resizeState) return;

    const rect = getRect(id);
    const custom = elementsConfig[id];
    const startX = custom?.positionMode === 'custom' && custom.x != null ? custom.x : rect.left;
    const startY = custom?.positionMode === 'custom' && custom.y != null ? custom.y : rect.top;
    const startWidth = custom?.positionMode === 'custom' && custom.width != null ? custom.width : rect.width || 120;
    const startHeight = custom?.positionMode === 'custom' && custom.height != null ? custom.height : rect.height || 40;

    const target = e.currentTarget as HTMLElement;
    resizeState = {
      elementId: id,
      direction,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startElemX: startX,
      startElemY: startY,
      startElemWidth: startWidth,
      startElemHeight: startHeight,
      pointerId: e.pointerId,
      captureTarget: target,
      preserveAspect: id === 'badge'
    };

    onSelectElement(id);
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}
  }

  function handlePointerMove(e: PointerEvent) {
    // 1. Resizing logic
    if (resizeState && e.pointerId === resizeState.pointerId) {
      const dx = (e.clientX - resizeState.startPointerX) / zoom;
      const dy = (e.clientY - resizeState.startPointerY) / zoom;

      let newX = resizeState.startElemX;
      let newY = resizeState.startElemY;
      let newWidth = resizeState.startElemWidth;
      let newHeight = resizeState.startElemHeight;

      const minWidth = 40;
      const minHeight = 24;

      // Handle horizontal resizing
      if (resizeState.direction === 'right' || resizeState.direction === 'se' || resizeState.direction === 'ne') {
        const rawW = resizeState.startElemWidth + dx;
        newWidth = Math.round(Math.max(minWidth, Math.min(1100 - resizeState.startElemX, rawW)));
      } else if (resizeState.direction === 'left' || resizeState.direction === 'sw' || resizeState.direction === 'nw') {
        const rawW = resizeState.startElemWidth - dx;
        newWidth = Math.round(Math.max(minWidth, Math.min(resizeState.startElemX + resizeState.startElemWidth, rawW)));
        newX = Math.round(resizeState.startElemX + (resizeState.startElemWidth - newWidth));
      }

      // Handle vertical resizing
      if (resizeState.direction === 'bottom' || resizeState.direction === 'se' || resizeState.direction === 'sw') {
        const rawH = resizeState.startElemHeight + dy;
        newHeight = Math.round(Math.max(minHeight, Math.min(780 - resizeState.startElemY, rawH)));
      } else if (resizeState.direction === 'top' || resizeState.direction === 'ne' || resizeState.direction === 'nw') {
        const rawH = resizeState.startElemHeight - dy;
        newHeight = Math.round(
          Math.max(minHeight, Math.min(resizeState.startElemY + resizeState.startElemHeight, rawH))
        );
        newY = Math.round(resizeState.startElemY + (resizeState.startElemHeight - newHeight));
      }

      // Preserve 1:1 aspect ratio for circular/square elements (e.g. badge)
      if (resizeState.preserveAspect) {
        const size = Math.max(newWidth, newHeight);
        newWidth = size;
        newHeight = size;

        if (resizeState.direction === 'nw') {
          newX = Math.round(resizeState.startElemX + (resizeState.startElemWidth - size));
          newY = Math.round(resizeState.startElemY + (resizeState.startElemHeight - size));
        } else if (resizeState.direction === 'ne') {
          newY = Math.round(resizeState.startElemY + (resizeState.startElemHeight - size));
        } else if (resizeState.direction === 'sw') {
          newX = Math.round(resizeState.startElemX + (resizeState.startElemWidth - size));
        }
      }

      // Clamp coordinates safely within canvas
      newX = Math.max(0, Math.min(1100 - newWidth, newX));
      newY = Math.max(0, Math.min(780 - newHeight, newY));

      if (!design.elements) design.elements = {};
      design.elements[resizeState.elementId] = {
        ...design.elements[resizeState.elementId],
        enabled: true,
        positionMode: 'custom',
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      };

      return;
    }

    // 2. Dragging / Moving logic
    if (!dragState || e.pointerId !== dragState.pointerId) return;

    const dx = (e.clientX - dragState.startPointerX) / zoom;
    const dy = (e.clientY - dragState.startPointerY) / zoom;

    let newX = Math.round(dragState.startElemX + dx);
    let newY = Math.round(dragState.startElemY + dy);

    // Canvas center and margin snapping (1100 x 780)
    const canvasCenterX = 550;
    const canvasCenterY = 390;
    const canvasMargin = 48;
    const snapThreshold = 8;

    const elemCenterX = newX + dragState.elemWidth / 2;
    const elemCenterY = newY + dragState.elemHeight / 2;

    if (Math.abs(elemCenterX - canvasCenterX) <= snapThreshold) {
      newX = Math.round(canvasCenterX - dragState.elemWidth / 2);
      snapGuideX = canvasCenterX;
    } else if (Math.abs(newX - canvasMargin) <= snapThreshold) {
      newX = canvasMargin;
      snapGuideX = canvasMargin;
    } else if (Math.abs(newX + dragState.elemWidth - (1100 - canvasMargin)) <= snapThreshold) {
      newX = 1100 - canvasMargin - dragState.elemWidth;
      snapGuideX = 1100 - canvasMargin;
    } else {
      snapGuideX = null;
    }

    if (Math.abs(elemCenterY - canvasCenterY) <= snapThreshold) {
      newY = Math.round(canvasCenterY - dragState.elemHeight / 2);
      snapGuideY = canvasCenterY;
    } else if (Math.abs(newY - canvasMargin) <= snapThreshold) {
      newY = canvasMargin;
      snapGuideY = canvasMargin;
    } else if (Math.abs(newY + dragState.elemHeight - (780 - canvasMargin)) <= snapThreshold) {
      newY = 780 - canvasMargin - dragState.elemHeight;
      snapGuideY = 780 - canvasMargin;
    } else {
      snapGuideY = null;
    }

    // Clamp to canvas boundaries
    newX = Math.max(0, Math.min(1100 - dragState.elemWidth, newX));
    newY = Math.max(0, Math.min(780 - dragState.elemHeight, newY));

    if (!design.elements) design.elements = {};
    design.elements[dragState.elementId] = {
      ...design.elements[dragState.elementId],
      enabled: true,
      positionMode: 'custom',
      x: newX,
      y: newY,
      width: dragState.elemWidth,
      height: dragState.elemHeight
    };
  }

  function releasePointerCapture() {
    if (!dragState) return;

    try {
      if (dragState.captureTarget.hasPointerCapture(dragState.pointerId)) {
        dragState.captureTarget.releasePointerCapture(dragState.pointerId);
      }
    } catch {
      // Browsers also release pointer capture automatically when the pointer ends.
    }
  }

  function finishDrag(event?: PointerEvent) {
    if (!dragState || (event && event.pointerId !== dragState.pointerId)) return;

    releasePointerCapture();

    dragState = null;
    snapGuideX = null;
    snapGuideY = null;
    setTimeout(measureIframeElements, 60);
  }

  function finishResize(event?: PointerEvent) {
    if (!resizeState || (event && event.pointerId !== resizeState.pointerId)) return;

    try {
      if (resizeState.captureTarget.hasPointerCapture(resizeState.pointerId)) {
        resizeState.captureTarget.releasePointerCapture(resizeState.pointerId);
      }
    } catch {}

    resizeState = null;
    setTimeout(measureIframeElements, 60);
  }

  function finishPointerAction(event?: PointerEvent) {
    if (dragState) finishDrag(event);
    if (resizeState) finishResize(event);
  }

  onDestroy(() => {
    releasePointerCapture();
    dragState = null;
    if (resizeState) {
      try {
        if (resizeState.captureTarget.hasPointerCapture(resizeState.pointerId)) {
          resizeState.captureTarget.releasePointerCapture(resizeState.pointerId);
        }
      } catch {}
      resizeState = null;
    }
  });

  function handleCenterHorizontal(id: StudioElementId) {
    const rect = getRect(id);
    const width = rect.width || 200;
    const newX = Math.round((1100 - width) / 2);
    const custom = elementsConfig[id];
    const currentY = custom?.y ?? rect.top;

    if (!design.elements) design.elements = {};
    design.elements[id] = {
      ...design.elements[id],
      enabled: true,
      positionMode: 'custom',
      x: newX,
      y: currentY,
      width: rect.width,
      height: rect.height
    };
    setTimeout(measureIframeElements, 60);
  }

  function handleCenterVertical(id: StudioElementId) {
    const rect = getRect(id);
    const height = rect.height || 40;
    const newY = Math.round((780 - height) / 2);
    const custom = elementsConfig[id];
    const currentX = custom?.x ?? rect.left;

    if (!design.elements) design.elements = {};
    design.elements[id] = {
      ...design.elements[id],
      enabled: true,
      positionMode: 'custom',
      x: currentX,
      y: newY,
      width: rect.width,
      height: rect.height
    };
    setTimeout(measureIframeElements, 60);
  }

  function handleResetAuto(id: StudioElementId) {
    if (!design.elements) design.elements = {};
    design.elements[id] = {
      ...design.elements[id],
      positionMode: 'auto',
      x: undefined,
      y: undefined
    };
    setTimeout(measureIframeElements, 60);
  }

  function handleDeleteElement(id: StudioElementId) {
    if (id === 'recipient' || id === 'course') return; // Mandatory fields cannot be deleted
    if (!design.elements) design.elements = {};
    design.elements[id] = {
      ...design.elements[id],
      enabled: false
    };
    if (selectedElement === id) {
      onSelectElement(null);
    }
    setTimeout(measureIframeElements, 60);
  }

  function handleSelect(id: StudioElementId, tool: ToolCategory) {
    onSelectElement(id);
    onSelectTool(tool);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!selectedElement) return;

    const target = e.target as HTMLElement;
    if (['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable) return;

    const delta = e.shiftKey ? 10 : 1;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (selectedElement === 'border') return;

      e.preventDefault();
      const rect = getRect(selectedElement);
      const custom = elementsConfig[selectedElement];
      const startX = custom?.positionMode === 'custom' && custom.x != null ? custom.x : rect.left;
      const startY = custom?.positionMode === 'custom' && custom.y != null ? custom.y : rect.top;

      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowUp') dy = -delta;
      else if (e.key === 'ArrowDown') dy = delta;
      else if (e.key === 'ArrowLeft') dx = -delta;
      else if (e.key === 'ArrowRight') dx = delta;

      if (!design.elements) design.elements = {};
      design.elements[selectedElement] = {
        ...design.elements[selectedElement],
        enabled: true,
        positionMode: 'custom',
        x: Math.max(0, Math.min(1100 - rect.width, startX + dx)),
        y: Math.max(0, Math.min(780 - rect.height, startY + dy)),
        width: rect.width,
        height: rect.height
      };
      setTimeout(measureIframeElements, 60);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedElement !== 'recipient' && selectedElement !== 'course') {
        e.preventDefault();
        handleDeleteElement(selectedElement);
      }
    } else if (e.key === 'Escape') {
      onSelectElement(null);
    }
  }

  const TOOLS = [
    { id: 'layout' as const, label: 'certificate_studio.tool_layout', icon: LayoutIcon },
    { id: 'borders' as const, label: 'certificate_studio.tool_borders', icon: SquareIcon },
    { id: 'typography' as const, label: 'certificate_studio.tool_typography', icon: TypeIcon },
    { id: 'badges' as const, label: 'certificate_studio.tool_badges', icon: AwardIcon },
    { id: 'qrcode' as const, label: 'certificate_studio.tool_qrcode', icon: HashIcon },
    { id: 'signatories' as const, label: 'certificate_studio.tool_signatories', icon: PenToolIcon },
    { id: 'background' as const, label: 'certificate_studio.tool_background', icon: PaletteIcon }
  ];

  const zoomPercent = $derived(Math.round(zoom * 100));

  // Determine which elements should render bounding boxes
  const showHeader = $derived(elementsConfig.header?.enabled !== false);
  const showTitle = $derived(elementsConfig.title?.enabled !== false);
  const showSubtitle = $derived(elementsConfig.subtitle?.enabled !== false);
  const showCourse = true;
  const showDescription = $derived(elementsConfig.description?.enabled !== false);
  const showDate = $derived(elementsConfig.date?.enabled !== false);
  const showBadge = $derived(elementsConfig.badge?.enabled !== false && design.badge?.style !== 'none');
  const showSignatories = $derived(elementsConfig.signatories?.enabled !== false);
  const showQr = $derived(elementsConfig.qrCode?.enabled !== false && design.qrCode?.enabled !== false);
  const showBorder = $derived(elementsConfig.border?.enabled !== false);
</script>

<svelte:window onkeydown={handleKeyDown} />

<main class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
  <!-- Top canvas status bar -->
  <div
    class="flex h-8 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/70 px-4 text-[11px] text-slate-500 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/70"
  >
    <div class="flex items-center gap-2">
      <span class="font-medium tracking-wide">{$t('certificate_studio.canvas_label')}</span>
      <span class="font-mono text-[10px] text-slate-400">297mm × 210mm</span>
    </div>
    <div class="flex items-center gap-1.5">
      <Button
        variant="secondary"
        size="icon"
        class="h-6 w-6 p-0"
        onclick={onZoomOut}
        title={$t('certificate_studio.zoom_out')}
        aria-label={$t('certificate_studio.zoom_out')}
      >
        <ZoomOutIcon class="size-3.5 text-slate-500" />
      </Button>
      <span class="min-w-8 text-center font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
        {zoomPercent}%
      </span>
      <Button
        variant="secondary"
        size="icon"
        class="h-6 w-6 p-0"
        onclick={onZoomIn}
        title={$t('certificate_studio.zoom_in')}
        aria-label={$t('certificate_studio.zoom_in')}
      >
        <ZoomInIcon class="size-3.5 text-slate-500" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        class="h-6 gap-1 px-1.5 text-[11px] text-slate-500"
        onclick={onFit}
        title={$t('certificate_studio.fit_to_screen')}
      >
        <Maximize2Icon class="size-3" />
        <span>{$t('certificate_studio.fit')}</span>
      </Button>
    </div>
  </div>

  <!-- Live Canvas Container -->
  <div
    bind:this={stageElement}
    class="relative flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle,#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] p-6 select-none dark:bg-[radial-gradient(circle,#334155_1px,transparent_1px)]"
  >
    <!-- Scaled Layout Sizer -->
    <div
      class="relative flex shrink-0 items-center justify-center transition-[width,height] duration-75 ease-out"
      style:width="{Math.round(1100 * zoom)}px"
      style:height="{Math.round(780 * zoom)}px"
    >
      <div
        bind:this={canvasContainer}
        class="absolute origin-center rounded-xs shadow-2xl transition-transform duration-75 ease-out"
        style:width="1100px"
        style:height="780px"
        style:transform="scale({zoom})"
      >
        <Certificate.Preview {design} data={previewData} zoom={1.0} showControls={false} class="h-full w-full" />

        <!-- Snap guide lines -->
        {#if snapGuideX != null}
          <div
            class="pointer-events-none absolute top-0 bottom-0 z-40 w-[1px] -translate-x-1/2 border-l-2 border-dashed border-amber-500 shadow-sm"
            style:left="{snapGuideX}px"
          ></div>
        {/if}
        {#if snapGuideY != null}
          <div
            class="pointer-events-none absolute right-0 left-0 z-40 h-[1px] -translate-y-1/2 border-t-2 border-dashed border-amber-500 shadow-sm"
            style:top="{snapGuideY}px"
          ></div>
        {/if}

        <!-- Interactive Canvas Stage Overlay for Element Hover, Selection & Dragging -->
        <div
          class="absolute inset-0 z-20"
          onclick={() => {
            onSelectElement('background');
            onSelectTool('background');
          }}
          onpointermove={handlePointerMove}
          onpointerup={finishPointerAction}
          onpointercancel={finishPointerAction}
          role="presentation"
        >
          <!-- Border / Frame Perimeter (Layer 10: Behind text/badges so interior clicks reach text elements) -->
          {#if showBorder}
            <div
              role="button"
              tabindex="0"
              class="pointer-events-auto absolute inset-3 z-10 cursor-pointer rounded-xs transition-all duration-150 {selectedElement ===
                'border' || selectedTool === 'borders'
                ? 'border-2 border-amber-500 shadow-sm ring-1 ring-amber-500/30'
                : hoveredZone === 'border'
                  ? 'border-2 border-dashed border-amber-400'
                  : 'border border-transparent hover:border-amber-300/40'}"
              onmouseenter={() => (hoveredZone = 'border')}
              onmouseleave={() => {
                if (hoveredZone === 'border') hoveredZone = null;
              }}
              onclick={(e) => {
                e.stopPropagation();
                handleSelect('border', 'borders');
              }}
              onkeydown={(e) => {
                if (e.key === 'Enter') handleSelect('border', 'borders');
              }}
              aria-label={$t('certificate_studio.element_border')}
            >
              {#if selectedElement === 'border' || (hoveredZone === 'border' && !selectedElement)}
                <div
                  class="pointer-events-auto absolute top-2 left-2 flex items-center gap-1 rounded bg-amber-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm select-none"
                >
                  <span>{$t('certificate_studio.element_border')}</span>
                </div>
              {/if}

              {#if selectedElement === 'border'}
                <!-- Border Corner Anchor Handles -->
                <span
                  class="pointer-events-none absolute -top-2 -left-2 size-4 rounded-xs border-2 border-amber-600 bg-white shadow-md ring-1 ring-black/10 dark:border-amber-400 dark:bg-slate-900"
                  aria-hidden="true"
                ></span>
                <span
                  class="pointer-events-none absolute -top-2 -right-2 size-4 rounded-xs border-2 border-amber-600 bg-white shadow-md ring-1 ring-black/10 dark:border-amber-400 dark:bg-slate-900"
                  aria-hidden="true"
                ></span>
                <span
                  class="pointer-events-none absolute -bottom-2 -left-2 size-4 rounded-xs border-2 border-amber-600 bg-white shadow-md ring-1 ring-black/10 dark:border-amber-400 dark:bg-slate-900"
                  aria-hidden="true"
                ></span>
                <span
                  class="pointer-events-none absolute -right-2 -bottom-2 size-4 rounded-xs border-2 border-amber-600 bg-white shadow-md ring-1 ring-black/10 dark:border-amber-400 dark:bg-slate-900"
                  aria-hidden="true"
                ></span>
              {/if}
            </div>
          {/if}

          <!-- Header / Org Name Zone -->
          {#if showHeader}
            <CanvasElementZone
              id="header"
              label={$t('certificate_studio.org_name')}
              tool="typography"
              selected={selectedElement === 'header'}
              hovered={hoveredZone === 'header'}
              positionMode={elementsConfig.header?.positionMode}
              x={elementsConfig.header?.x}
              y={elementsConfig.header?.y}
              left={getRect('header').left}
              top={getRect('header').top}
              width={getRect('header').width}
              height={getRect('header').height}
              onSelect={handleSelect}
              onHover={(id) => (hoveredZone = id)}
              onCenterHorizontal={handleCenterHorizontal}
              onCenterVertical={handleCenterVertical}
              onResetAuto={handleResetAuto}
              onDelete={handleDeleteElement}
              onStartDrag={handleStartDrag}
              onStartResize={handleStartResize}
            />
          {/if}

          <!-- Title Zone -->
          {#if showTitle}
            <CanvasElementZone
              id="title"
              label={$t('certificate_studio.certificate_title')}
              tool="typography"
              selected={selectedElement === 'title'}
              hovered={hoveredZone === 'title'}
              positionMode={elementsConfig.title?.positionMode}
              x={elementsConfig.title?.x}
              y={elementsConfig.title?.y}
              left={getRect('title').left}
              top={getRect('title').top}
              width={getRect('title').width}
              height={getRect('title').height}
              onSelect={handleSelect}
              onHover={(id) => (hoveredZone = id)}
              onCenterHorizontal={handleCenterHorizontal}
              onCenterVertical={handleCenterVertical}
              onResetAuto={handleResetAuto}
              onDelete={handleDeleteElement}
              onStartDrag={handleStartDrag}
              onStartResize={handleStartResize}
            />
          {/if}

          <!-- Subtitle Zone -->
          {#if showSubtitle}
            <CanvasElementZone
              id="subtitle"
              label={$t('certificate_studio.presentation_line')}
              tool="typography"
              selected={selectedElement === 'subtitle'}
              hovered={hoveredZone === 'subtitle'}
              positionMode={elementsConfig.subtitle?.positionMode}
              x={elementsConfig.subtitle?.x}
              y={elementsConfig.subtitle?.y}
              left={getRect('subtitle').left}
              top={getRect('subtitle').top}
              width={getRect('subtitle').width}
              height={getRect('subtitle').height}
              onSelect={handleSelect}
              onHover={(id) => (hoveredZone = id)}
              onCenterHorizontal={handleCenterHorizontal}
              onCenterVertical={handleCenterVertical}
              onResetAuto={handleResetAuto}
              onDelete={handleDeleteElement}
              onStartDrag={handleStartDrag}
              onStartResize={handleStartResize}
            />
          {/if}

          <!-- Recipient Name Zone (Mandatory) -->
          <CanvasElementZone
            id="recipient"
            label={$t('certificate_studio.target_recipient')}
            tool="typography"
            canDelete={false}
            selected={selectedElement === 'recipient'}
            hovered={hoveredZone === 'recipient'}
            positionMode={elementsConfig.recipient?.positionMode}
            x={elementsConfig.recipient?.x}
            y={elementsConfig.recipient?.y}
            left={getRect('recipient').left}
            top={getRect('recipient').top}
            width={getRect('recipient').width}
            height={getRect('recipient').height}
            onSelect={handleSelect}
            onHover={(id) => (hoveredZone = id)}
            onCenterHorizontal={handleCenterHorizontal}
            onCenterVertical={handleCenterVertical}
            onResetAuto={handleResetAuto}
            onStartDrag={handleStartDrag}
            onStartResize={handleStartResize}
          />

          <!-- Course Name Zone (Mandatory) -->
          {#if showCourse}
            <CanvasElementZone
              id="course"
              label={$t('certificate_studio.course_title')}
              tool="layout"
              canDelete={false}
              selected={selectedElement === 'course'}
              hovered={hoveredZone === 'course'}
              positionMode={elementsConfig.course?.positionMode}
              x={elementsConfig.course?.x}
              y={elementsConfig.course?.y}
              left={getRect('course').left}
              top={getRect('course').top}
              width={getRect('course').width}
              height={getRect('course').height}
              onSelect={handleSelect}
              onHover={(id) => (hoveredZone = id)}
              onCenterHorizontal={handleCenterHorizontal}
              onCenterVertical={handleCenterVertical}
              onResetAuto={handleResetAuto}
              onStartDrag={handleStartDrag}
              onStartResize={handleStartResize}
            />
          {/if}

          <!-- Description Zone -->
          {#if showDescription}
            <CanvasElementZone
              id="description"
              label={$t('certificate_studio.course_description')}
              tool="layout"
              selected={selectedElement === 'description'}
              hovered={hoveredZone === 'description'}
              positionMode={elementsConfig.description?.positionMode}
              x={elementsConfig.description?.x}
              y={elementsConfig.description?.y}
              left={getRect('description').left}
              top={getRect('description').top}
              width={getRect('description').width}
              height={getRect('description').height}
              onSelect={handleSelect}
              onHover={(id) => (hoveredZone = id)}
              onCenterHorizontal={handleCenterHorizontal}
              onCenterVertical={handleCenterVertical}
              onResetAuto={handleResetAuto}
              onDelete={handleDeleteElement}
              onStartDrag={handleStartDrag}
              onStartResize={handleStartResize}
            />
          {/if}

          <!-- Date Zone -->
          {#if showDate}
            <CanvasElementZone
              id="date"
              label={$t('certificate_studio.conferment_date')}
              tool="typography"
              selected={selectedElement === 'date'}
              hovered={hoveredZone === 'date'}
              positionMode={elementsConfig.date?.positionMode}
              x={elementsConfig.date?.x}
              y={elementsConfig.date?.y}
              left={getRect('date').left}
              top={getRect('date').top}
              width={getRect('date').width}
              height={getRect('date').height}
              onSelect={handleSelect}
              onHover={(id) => (hoveredZone = id)}
              onCenterHorizontal={handleCenterHorizontal}
              onCenterVertical={handleCenterVertical}
              onResetAuto={handleResetAuto}
              onDelete={handleDeleteElement}
              onStartDrag={handleStartDrag}
              onStartResize={handleStartResize}
            />
          {/if}

          <!-- Official Seal / Badge Zone -->
          {#if showBadge}
            <CanvasElementZone
              id="badge"
              label={$t('certificate_studio.element_badge')}
              tool="badges"
              isCircle={true}
              selected={selectedElement === 'badge'}
              hovered={hoveredZone === 'badge'}
              positionMode={elementsConfig.badge?.positionMode}
              x={elementsConfig.badge?.x}
              y={elementsConfig.badge?.y}
              left={getRect('badge').left}
              top={getRect('badge').top}
              width={getRect('badge').width}
              height={getRect('badge').height}
              onSelect={handleSelect}
              onHover={(id) => (hoveredZone = id)}
              onCenterHorizontal={handleCenterHorizontal}
              onCenterVertical={handleCenterVertical}
              onResetAuto={handleResetAuto}
              onDelete={handleDeleteElement}
              onStartDrag={handleStartDrag}
              onStartResize={handleStartResize}
            />
          {/if}

          <!-- Independent Signatory Zones (Separate highlights & controls, no overlap with seal) -->
          {#if showSignatories}
            {#each (design.signatories ?? []).filter((s) => s && s.enabled !== false) as sig, index (sig.id ?? index)}
              {@const sigId = `signatory-${index}` as StudioElementId}
              <CanvasElementZone
                id={sigId}
                label={sig.name ? sig.name : `${$t('certificate_studio.signatory_1').replace('1', String(index + 1))}`}
                tool="signatories"
                selected={selectedElement === sigId}
                hovered={hoveredZone === sigId}
                positionMode={elementsConfig[sigId]?.positionMode}
                x={elementsConfig[sigId]?.x}
                y={elementsConfig[sigId]?.y}
                left={getRect(sigId).left}
                top={getRect(sigId).top}
                width={getRect(sigId).width}
                height={getRect(sigId).height}
                onSelect={handleSelect}
                onHover={(id) => (hoveredZone = id)}
                onCenterHorizontal={handleCenterHorizontal}
                onCenterVertical={handleCenterVertical}
                onResetAuto={handleResetAuto}
                onDelete={() => {
                  sig.enabled = false;
                }}
                onStartDrag={handleStartDrag}
                onStartResize={handleStartResize}
              />
            {/each}
          {/if}

          <!-- QR Code Zone -->
          {#if showQr}
            <CanvasElementZone
              id="qrCode"
              label={$t('certificate_studio.qr_credential')}
              tool="qrcode"
              selected={selectedElement === 'qrCode'}
              hovered={hoveredZone === 'qrCode'}
              positionMode={elementsConfig.qrCode?.positionMode}
              x={elementsConfig.qrCode?.x}
              y={elementsConfig.qrCode?.y}
              left={getRect('qrCode').left}
              top={getRect('qrCode').top}
              width={getRect('qrCode').width}
              height={getRect('qrCode').height}
              onSelect={handleSelect}
              onHover={(id) => (hoveredZone = id)}
              onCenterHorizontal={handleCenterHorizontal}
              onCenterVertical={handleCenterVertical}
              onResetAuto={handleResetAuto}
              onDelete={handleDeleteElement}
              onStartDrag={handleStartDrag}
              onStartResize={handleStartResize}
            />
          {/if}

          <!-- Live Resize Dimension Pill -->
          {#if resizeState}
            {@const rId = resizeState.elementId}
            {@const rRect = getRect(rId)}
            <div
              class="pointer-events-none absolute z-50 rounded-full border border-amber-500/80 bg-slate-950/95 px-3 py-1 font-mono text-xs font-bold text-amber-300 shadow-2xl ring-1 ring-white/10 backdrop-blur-md select-none"
              style:left="{rRect.left + rRect.width / 2}px"
              style:top="{Math.min(740, rRect.top + rRect.height + 14)}px"
              style:transform="translateX(-50%)"
            >
              W: {Math.round(rRect.width)}px · H: {Math.round(rRect.height)}px
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Floating Tools Dock -->
  <div
    class="pointer-events-auto absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/95"
  >
    {#each TOOLS as tool (tool.id)}
      {@const Icon = tool.icon}
      <Tooltip.Root delayDuration={150}>
        <Tooltip.Trigger>
          <Button
            variant={selectedTool === tool.id ? 'secondary' : 'ghost'}
            size="icon"
            class="size-9 rounded-full transition-all active:scale-95 {selectedTool === tool.id
              ? 'bg-amber-100 text-amber-900 shadow-xs dark:bg-amber-950 dark:text-amber-200'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'}"
            onclick={() => {
              onSelectTool(tool.id);
              if (tool.id === 'typography') onSelectElement('title');
              else if (tool.id === 'borders') onSelectElement('border');
              else if (tool.id === 'badges') onSelectElement('badge');
              else if (tool.id === 'layout') onSelectElement('course');
              else if (tool.id === 'signatories') onSelectElement('signatory-0');
              else if (tool.id === 'qrcode') onSelectElement('qrCode');
              else if (tool.id === 'background') onSelectElement('background');
            }}
            aria-label={$t(tool.label)}
          >
            <Icon
              class="size-4 shrink-0 {selectedTool === tool.id
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-600 dark:text-slate-400'}"
            />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content side="top" sideOffset={8} class="text-xs font-medium">
          {$t(tool.label)}
        </Tooltip.Content>
      </Tooltip.Root>
    {/each}
  </div>
</main>
