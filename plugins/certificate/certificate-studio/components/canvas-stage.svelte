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

  let hoveredZone = $state<StudioElementId | null>(null);

  const layout = $derived(design.layout ?? {});
  const titleY = $derived(75 + (layout.titleOffsetY ?? 0));
  const recipientY = $derived(205 + (layout.recipientOffsetY ?? 0));
  const courseY = $derived(315 + (layout.courseOffsetY ?? 0));
  const badgeY = $derived(560 + (layout.badgeOffsetY ?? 0));
  const footerY = $derived(570 + (layout.footerOffsetY ?? 0));

  function nudgeOffset(key: keyof NonNullable<CertificateDesign['layout']>, delta: number) {
    if (!design.layout) design.layout = {};
    const current = (design.layout[key] as number) ?? 0;
    design.layout[key] = current + delta;
  }

  function resetOffset(key: keyof NonNullable<CertificateDesign['layout']>) {
    if (!design.layout) return;
    design.layout[key] = 0;
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
            left={140}
            top={titleY}
            width={820}
            height={125}
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
            left={160}
            top={recipientY}
            width={780}
            height={95}
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
            left={160}
            top={courseY}
            width={780}
            height={135}
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
            left={480}
            top={badgeY}
            width={140}
            height={140}
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
            left={90}
            top={footerY}
            width={270}
            height={125}
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
            left={740}
            top={footerY}
            width={270}
            height={125}
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
            right={28}
            bottom={24}
            width={160}
            height={65}
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
