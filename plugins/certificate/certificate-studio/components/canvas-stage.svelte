<script lang="ts">
  import { Certificate } from '@cio/ui';
  import { Button } from '@cio/ui/base/button';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import LayoutIcon from '@lucide/svelte/icons/layout';
  import SquareIcon from '@lucide/svelte/icons/square';
  import TypeIcon from '@lucide/svelte/icons/type';
  import AwardIcon from '@lucide/svelte/icons/award';
  import QrCodeIcon from '@lucide/svelte/icons/qr-code';
  import PenToolIcon from '@lucide/svelte/icons/pen-tool';
  import PaletteIcon from '@lucide/svelte/icons/palette';
  import ZoomInIcon from '@lucide/svelte/icons/zoom-in';
  import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
  import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
  import { t } from '$lib/utils/functions/translations';
  import type { CertificateDesign } from '@cio/certificates';
  import type { ToolCategory, StudioElementId } from '../types';
  import CanvasElementZone from './canvas-element-zone.svelte';

  interface Props {
    design: CertificateDesign;
    previewData: Record<string, any>;
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

  type ElementRects = Record<StudioElementId, ElementRect>;

  let measuredRects = $state<Partial<ElementRects>>({});

  const layout = $derived(design.layout ?? {});

  const CALIBRATED_FALLBACKS: ElementRects = {
    title: { left: 140, top: 75, width: 820, height: 110 },
    recipient: { left: 160, top: 195, width: 780, height: 85 },
    course: { left: 160, top: 295, width: 780, height: 115 },
    badge: { left: 485, top: 565, width: 130, height: 130 },
    'sig-left': { left: 110, top: 565, width: 240, height: 130 },
    'sig-right': { left: 550, top: 565, width: 240, height: 130 },
    qrcode: { left: 915, top: 690, width: 155, height: 60 },
    border: { left: 12, top: 12, width: 1076, height: 756 }
  };

  function getRect(id: StudioElementId): ElementRect {
    if (measuredRects[id]) {
      return measuredRects[id]!;
    }
    const fallback = CALIBRATED_FALLBACKS[id] ?? { left: 0, top: 0, width: 100, height: 100 };
    if (id === 'title') return { ...fallback, top: fallback.top + (layout.titleOffsetY ?? 0) };
    if (id === 'recipient') return { ...fallback, top: fallback.top + (layout.recipientOffsetY ?? 0) };
    if (id === 'course') return { ...fallback, top: fallback.top + (layout.courseOffsetY ?? 0) };
    if (id === 'badge') return { ...fallback, top: fallback.top + (layout.badgeOffsetY ?? 0) };
    if (id === 'sig-left' || id === 'sig-right')
      return { ...fallback, top: fallback.top + (layout.footerOffsetY ?? 0) };
    return fallback;
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

    const toRect = (el: Element | null, padX = 8, padY = 6): ElementRect | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return {
        left: Math.round(r.left - certRect.left - padX),
        top: Math.round(r.top - certRect.top - padY),
        width: Math.round(r.width + padX * 2),
        height: Math.round(r.height + padY * 2)
      };
    };

    const next: Partial<ElementRects> = {};

    const titleEl = doc.querySelector('.title-zone');
    const titleRect = toRect(titleEl, 12, 6);
    if (titleRect) next.title = titleRect;

    const recipientEl = doc.querySelector('.recipient-zone');
    const recipientRect = toRect(recipientEl, 16, 6);
    if (recipientRect) next.recipient = recipientRect;

    const courseEl = doc.querySelector('.course-zone');
    const courseRect = toRect(courseEl, 16, 8);
    if (courseRect) next.course = courseRect;

    const badgeEl = doc.querySelector('.badge-container svg') || doc.querySelector('.badge-container');
    const badgeRect = toRect(badgeEl, 6, 6);
    if (badgeRect) next.badge = badgeRect;

    const sigCols = doc.querySelectorAll('.footer-zone .sig-col');
    if (sigCols[0]) {
      const leftSigRect = toRect(sigCols[0], 10, 8);
      if (leftSigRect) next['sig-left'] = leftSigRect;
    }
    if (sigCols[1]) {
      const rightSigRect = toRect(sigCols[1], 10, 8);
      if (rightSigRect) next['sig-right'] = rightSigRect;
    }

    const qrEl = doc.querySelector('.modular-qr');
    const qrRect = toRect(qrEl, 4, 4);
    if (qrRect) next.qrcode = qrRect;

    measuredRects = { ...measuredRects, ...next };
  }

  $effect(() => {
    // Read reactive design and previewData to trigger updates
    const _d = design;
    const _p = previewData;

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

  function nudgeOffset(key: keyof NonNullable<CertificateDesign['layout']>, delta: number) {
    if (!design.layout) design.layout = {};
    const current = (design.layout[key] as number) ?? 0;
    design.layout[key] = current + delta;

    if (selectedElement && measuredRects[selectedElement]) {
      measuredRects[selectedElement] = {
        ...measuredRects[selectedElement]!,
        top: measuredRects[selectedElement]!.top + delta
      };
    }
  }

  function resetOffset(key: keyof NonNullable<CertificateDesign['layout']>) {
    if (!design.layout) return;
    const current = (design.layout[key] as number) ?? 0;
    design.layout[key] = 0;

    if (selectedElement && measuredRects[selectedElement]) {
      measuredRects[selectedElement] = {
        ...measuredRects[selectedElement]!,
        top: measuredRects[selectedElement]!.top - current
      };
    }
    setTimeout(measureIframeElements, 50);
  }

  function handleSelect(id: StudioElementId, tool: ToolCategory) {
    onSelectElement(id);
    onSelectTool(tool);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!selectedElement) return;
    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable) return;

    const delta = e.shiftKey ? 10 : 2;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedElement === 'title') nudgeOffset('titleOffsetY', -delta);
      else if (selectedElement === 'recipient') nudgeOffset('recipientOffsetY', -delta);
      else if (selectedElement === 'course') nudgeOffset('courseOffsetY', -delta);
      else if (selectedElement === 'badge') nudgeOffset('badgeOffsetY', -delta);
      else if (selectedElement === 'sig-left' || selectedElement === 'sig-right') nudgeOffset('footerOffsetY', -delta);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectedElement === 'title') nudgeOffset('titleOffsetY', delta);
      else if (selectedElement === 'recipient') nudgeOffset('recipientOffsetY', delta);
      else if (selectedElement === 'course') nudgeOffset('courseOffsetY', delta);
      else if (selectedElement === 'badge') nudgeOffset('badgeOffsetY', delta);
      else if (selectedElement === 'sig-left' || selectedElement === 'sig-right') nudgeOffset('footerOffsetY', delta);
    } else if (e.key === 'Escape') {
      onSelectElement(null);
    }
  }

  const TOOLS = [
    { id: 'layout' as const, label: 'certificate_studio.tool_layout', icon: LayoutIcon },
    { id: 'borders' as const, label: 'certificate_studio.tool_borders', icon: SquareIcon },
    { id: 'typography' as const, label: 'certificate_studio.tool_typography', icon: TypeIcon },
    { id: 'badges' as const, label: 'certificate_studio.tool_badges', icon: AwardIcon },
    { id: 'qrcode' as const, label: 'certificate_studio.tool_qrcode', icon: QrCodeIcon },
    { id: 'signatories' as const, label: 'certificate_studio.tool_signatories', icon: PenToolIcon },
    { id: 'background' as const, label: 'certificate_studio.tool_background', icon: PaletteIcon }
  ];

  const zoomPercent = $derived(Math.round(zoom * 100));
</script>

<svelte:window onkeydown={handleKeyDown} />

<main class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100 dark:bg-slate-950">
  <!-- Top canvas status bar -->
  <div
    class="flex h-8 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/70 px-4 text-[11px] text-slate-500 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/70"
  >
    <div class="flex items-center gap-2">
      <span class="font-medium tracking-wide">CANVAS (A4 Landscape: 1100 × 780)</span>
      <span class="font-mono text-[10px] text-slate-400">297mm × 210mm</span>
    </div>
    <div class="flex items-center gap-1.5">
      <Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={onZoomOut} title="Zoom Out">
        <ZoomOutIcon class="size-3.5 text-slate-500" />
      </Button>
      <span class="min-w-8 text-center font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
        {zoomPercent}%
      </span>
      <Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={onZoomIn} title="Zoom In">
        <ZoomInIcon class="size-3.5 text-slate-500" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        class="h-6 gap-1 px-1.5 text-[11px] text-slate-500"
        onclick={onFit}
        title="Fit to screen"
      >
        <Maximize2Icon class="size-3" />
        <span>Fit</span>
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

        <!-- Interactive Canvas Stage Overlay for Element Hover, Selection & Nudge -->
        <div class="absolute inset-0 z-20" onclick={() => onSelectElement(null)} role="presentation">
          <!-- Border / Frame Perimeter (Layer 10: Behind text/badges so interior clicks reach text elements) -->
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
            aria-label="Certificate Border"
          >
            {#if selectedElement === 'border' || (hoveredZone === 'border' && !selectedElement)}
              <div
                class="pointer-events-auto absolute top-2 left-2 flex items-center gap-1 rounded bg-amber-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-sm select-none"
              >
                <span>Border & Frame</span>
              </div>
            {/if}
          </div>

          <!-- Title & Subtitle Zone -->
          <CanvasElementZone
            id="title"
            label="Title & Heading"
            tool="typography"
            selected={selectedElement === 'title'}
            hovered={hoveredZone === 'title'}
            offset={layout.titleOffsetY ?? 0}
            left={getRect('title').left}
            top={getRect('title').top}
            width={getRect('title').width}
            height={getRect('title').height}
            onSelect={handleSelect}
            onHover={(id) => (hoveredZone = id)}
            onNudge={(delta) => nudgeOffset('titleOffsetY', delta)}
            onReset={() => resetOffset('titleOffsetY')}
          />

          <!-- Recipient Name Zone -->
          <CanvasElementZone
            id="recipient"
            label="Recipient Name"
            tool="typography"
            selected={selectedElement === 'recipient'}
            hovered={hoveredZone === 'recipient'}
            offset={layout.recipientOffsetY ?? 0}
            left={getRect('recipient').left}
            top={getRect('recipient').top}
            width={getRect('recipient').width}
            height={getRect('recipient').height}
            onSelect={handleSelect}
            onHover={(id) => (hoveredZone = id)}
            onNudge={(delta) => nudgeOffset('recipientOffsetY', delta)}
            onReset={() => resetOffset('recipientOffsetY')}
          />

          <!-- Course & Description Zone -->
          <CanvasElementZone
            id="course"
            label="Course & Description"
            tool="layout"
            selected={selectedElement === 'course'}
            hovered={hoveredZone === 'course'}
            offset={layout.courseOffsetY ?? 0}
            left={getRect('course').left}
            top={getRect('course').top}
            width={getRect('course').width}
            height={getRect('course').height}
            onSelect={handleSelect}
            onHover={(id) => (hoveredZone = id)}
            onNudge={(delta) => nudgeOffset('courseOffsetY', delta)}
            onReset={() => resetOffset('courseOffsetY')}
          />

          <!-- Official Seal / Badge Zone -->
          <CanvasElementZone
            id="badge"
            label="Official Seal"
            tool="badges"
            isCircle={true}
            selected={selectedElement === 'badge'}
            hovered={hoveredZone === 'badge'}
            offset={layout.badgeOffsetY ?? 0}
            left={getRect('badge').left}
            top={getRect('badge').top}
            width={getRect('badge').width}
            height={getRect('badge').height}
            onSelect={handleSelect}
            onHover={(id) => (hoveredZone = id)}
            onNudge={(delta) => nudgeOffset('badgeOffsetY', delta)}
            onReset={() => resetOffset('badgeOffsetY')}
          />

          <!-- Signatories Zone (Left) -->
          <CanvasElementZone
            id="sig-left"
            label="Signatures"
            tool="signatories"
            selected={selectedElement === 'sig-left'}
            hovered={hoveredZone === 'sig-left'}
            offset={layout.footerOffsetY ?? 0}
            left={getRect('sig-left').left}
            top={getRect('sig-left').top}
            width={getRect('sig-left').width}
            height={getRect('sig-left').height}
            onSelect={handleSelect}
            onHover={(id) => (hoveredZone = id)}
            onNudge={(delta) => nudgeOffset('footerOffsetY', delta)}
            onReset={() => resetOffset('footerOffsetY')}
          />

          <!-- Signatories Zone (Right) -->
          <CanvasElementZone
            id="sig-right"
            label="Signatures"
            tool="signatories"
            selected={selectedElement === 'sig-right'}
            hovered={hoveredZone === 'sig-right'}
            offset={layout.footerOffsetY ?? 0}
            left={getRect('sig-right').left}
            top={getRect('sig-right').top}
            width={getRect('sig-right').width}
            height={getRect('sig-right').height}
            onSelect={handleSelect}
            onHover={(id) => (hoveredZone = id)}
            onNudge={(delta) => nudgeOffset('footerOffsetY', delta)}
            onReset={() => resetOffset('footerOffsetY')}
          />

          <!-- QR Code Zone -->
          <CanvasElementZone
            id="qrcode"
            label="QR Code"
            tool="qrcode"
            selected={selectedElement === 'qrcode'}
            hovered={hoveredZone === 'qrcode'}
            left={getRect('qrcode').left}
            top={getRect('qrcode').top}
            width={getRect('qrcode').width}
            height={getRect('qrcode').height}
            onSelect={handleSelect}
            onHover={(id) => (hoveredZone = id)}
            onNudge={() => {}}
          />
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
              else if (tool.id === 'signatories') onSelectElement('sig-left');
              else if (tool.id === 'qrcode') onSelectElement('qrcode');
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
