<script lang="ts">
  import { Certificate } from '@cio/ui';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import type { CertificateDesign } from '@cio/certificates';
  import type { SelectedElement, ToolCategory } from '../types';
  import FloatingToolsDock from './floating-tools-dock.svelte';

  interface Props {
    compiledDesign: CertificateDesign;
    previewData: Record<string, any>;
    zoom: number;
    showGrid: boolean;
    showRulers: boolean;
    selectedElement: SelectedElement;
    selectedTool: ToolCategory;
    onSelectTool: (tool: ToolCategory) => void;
    onHotspotClick: (element: SelectedElement) => void;
    stageElement?: HTMLDivElement | null;
  }

  let {
    compiledDesign,
    previewData,
    zoom,
    showGrid,
    showRulers,
    selectedElement,
    selectedTool,
    onSelectTool,
    onHotspotClick,
    stageElement = $bindable(null)
  }: Props = $props();
</script>

<main class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-200/70 dark:bg-slate-950">
  <!-- Top banner hint / canvas indicator -->
  <div
    class="flex h-8 shrink-0 items-center justify-between border-b border-black/5 bg-white/40 px-4 text-[11px] text-slate-500 dark:border-white/5 dark:bg-slate-900/40"
  >
    <div class="flex items-center gap-2">
      <span class="font-medium tracking-wide">INTERACTIVE REAL-TIME CANVAS (A4 Landscape: 1100 × 780)</span>
      <span class="hidden font-mono text-[10px] text-slate-400 sm:inline">297mm × 210mm</span>
    </div>
    <div class="flex items-center gap-1.5 text-amber-700/80 dark:text-amber-400/80">
      <SparklesIcon class="size-3 text-amber-500" />
      <span class="text-[10px]">Tip: Click any element to inspect</span>
    </div>
  </div>

  <!-- Live Canvas Container -->
  <div
    bind:this={stageElement}
    class="relative flex flex-1 items-center justify-center overflow-hidden p-4 select-none"
  >
    <!-- Grid Pattern Overlay if enabled -->
    {#if showGrid}
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:bg-[radial-gradient(circle,#475569_1px,transparent_1px)]"
      ></div>
    {/if}

    <!-- Scaled Layout Sizer: ensures flexbox layout precisely matches visual scaled dimensions -->
    <div
      class="relative flex shrink-0 items-center justify-center transition-[width,height] duration-100 ease-out"
      style:width="{Math.round(1100 * zoom)}px"
      style:height="{Math.round(780 * zoom)}px"
    >
      <!-- Scaled Certificate Frame -->
      <div
        class="absolute origin-center transition-transform duration-100 ease-out"
        style:width="1100px"
        style:height="780px"
        style:transform="scale({zoom})"
      >
        <!-- Rulers / Safe Margin Guides if enabled -->
        {#if showRulers}
          <div
            class="pointer-events-none absolute inset-6 z-20 rounded-xs border border-dashed border-sky-400/80 bg-sky-500/5 shadow-xs"
          >
            <span class="absolute top-1 left-2 font-mono text-[9px] font-bold text-sky-600 uppercase">
              Safe Print Margin (25mm)
            </span>
          </div>
        {/if}

        <!-- Actual Certificate Renderer -->
        <div class="h-full w-full rounded-sm shadow-2xl">
          <Certificate.Preview
            design={compiledDesign}
            data={previewData}
            zoom={1.0}
            showControls={false}
            class="h-full w-full"
          />
        </div>

        <!-- Interactive Hotspot Click Overlays -->
        <div class="absolute inset-0 z-10">
          <!-- Border Hotspot (outer rim) -->
          <button
            type="button"
            class="absolute inset-0 cursor-pointer border-4 border-transparent transition-colors hover:border-amber-400/40 {selectedElement ===
            'border'
              ? 'border-amber-500/70 shadow-inner'
              : ''}"
            title="Click to edit Border properties"
            onclick={() => onHotspotClick('border')}
            aria-label="Edit Border"
          ></button>

          <!-- Title Hotspot -->
          <button
            type="button"
            class="absolute top-[80px] left-[150px] h-[90px] w-[800px] cursor-pointer rounded-sm border-2 border-transparent transition-colors hover:border-amber-400/50 hover:bg-amber-400/5 {selectedElement ===
            'title'
              ? 'border-amber-500 bg-amber-400/10'
              : ''}"
            title="Click to edit Title typography"
            onclick={() => onHotspotClick('title')}
            aria-label="Edit Title"
          ></button>

          <!-- Recipient Hotspot -->
          <button
            type="button"
            class="absolute top-[210px] left-[150px] h-[100px] w-[800px] cursor-pointer rounded-sm border-2 border-transparent transition-colors hover:border-amber-400/50 hover:bg-amber-400/5 {selectedElement ===
            'recipient'
              ? 'border-amber-500 bg-amber-400/10'
              : ''}"
            title="Click to edit Recipient typography"
            onclick={() => onHotspotClick('recipient')}
            aria-label="Edit Recipient"
          ></button>

          <!-- Body / Description Hotspot -->
          <button
            type="button"
            class="absolute top-[320px] left-[170px] h-[90px] w-[760px] cursor-pointer rounded-sm border-2 border-transparent transition-colors hover:border-amber-400/50 hover:bg-amber-400/5 {selectedElement ===
            'body'
              ? 'border-amber-500 bg-amber-400/10'
              : ''}"
            title="Click to edit Description typography"
            onclick={() => onHotspotClick('body')}
            aria-label="Edit Description"
          ></button>

          <!-- Signatories Hotspot -->
          <button
            type="button"
            class="absolute bottom-[40px] left-[60px] h-[140px] w-[350px] cursor-pointer rounded-sm border-2 border-transparent transition-colors hover:border-amber-400/50 hover:bg-amber-400/5 {selectedElement ===
            'signatories'
              ? 'border-amber-500 bg-amber-400/10'
              : ''}"
            title="Click to edit Signatory 1"
            onclick={() => onHotspotClick('signatories')}
            aria-label="Edit Signatories"
          ></button>

          <!-- Badge / Seal Hotspot -->
          <button
            type="button"
            class="absolute bottom-[40px] left-[480px] h-[140px] w-[140px] cursor-pointer rounded-full border-2 border-transparent transition-colors hover:border-amber-400/50 hover:bg-amber-400/5 {selectedElement ===
            'badge'
              ? 'border-amber-500 bg-amber-400/10'
              : ''}"
            title="Click to edit Badge / Seal"
            onclick={() => onHotspotClick('badge')}
            aria-label="Edit Badge"
          ></button>

          <!-- Signatory 2 Hotspot -->
          <button
            type="button"
            class="absolute right-[60px] bottom-[40px] h-[140px] w-[350px] cursor-pointer rounded-sm border-2 border-transparent transition-colors hover:border-amber-400/50 hover:bg-amber-400/5 {selectedElement ===
            'signatories'
              ? 'border-amber-500 bg-amber-400/10'
              : ''}"
            title="Click to edit Signatory 2"
            onclick={() => onHotspotClick('signatories')}
            aria-label="Edit Signatories"
          ></button>

          <!-- QR Code Hotspot (bottom-right) -->
          {#if compiledDesign.qrCode?.enabled}
            <button
              type="button"
              class="absolute right-[30px] bottom-[30px] h-[55px] w-[160px] cursor-pointer rounded-sm border-2 border-transparent transition-colors hover:border-amber-400/50 hover:bg-amber-400/5 {selectedElement ===
              'qrcode'
                ? 'border-amber-500 bg-amber-400/10'
                : ''}"
              title="Click to edit QR Code settings"
              onclick={() => onHotspotClick('qrcode')}
              aria-label="Edit QR Code"
            ></button>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Figma-style Floating Toolbar Dock -->
  <FloatingToolsDock {selectedTool} {onSelectTool} />
</main>
