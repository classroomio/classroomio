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
  import type { ToolCategory } from '../types';

  interface Props {
    design: CertificateDesign;
    previewData: Record<string, any>;
    zoom: number;
    selectedTool: ToolCategory;
    onSelectTool: (tool: ToolCategory) => void;
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
    onSelectTool,
    onZoomIn,
    onZoomOut,
    onFit,
    stageElement = $bindable(null)
  }: Props = $props();

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
      </div>
    </div>
  </div>

  <!-- Floating Tools Dock -->
  <div
    class="pointer-events-auto absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/95"
  >
    {#each TOOLS as tool (tool.id)}
      <Tooltip.Root delayDuration={150}>
        <Tooltip.Trigger>
          <Button
            variant={selectedTool === tool.id ? 'secondary' : 'ghost'}
            size="icon"
            class="size-9 rounded-full transition-all active:scale-95 {selectedTool === tool.id
              ? 'bg-amber-100 text-amber-900 shadow-xs dark:bg-amber-950 dark:text-amber-200'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'}"
            onclick={() => onSelectTool(tool.id)}
            aria-label={$t(tool.label)}
          >
            <svelte:component
              this={tool.icon}
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
