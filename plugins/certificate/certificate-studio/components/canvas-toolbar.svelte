<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Label } from '@cio/ui/base/label';
  import ZoomInIcon from '@lucide/svelte/icons/zoom-in';
  import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
  import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
  import GridIcon from '@lucide/svelte/icons/grid';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    zoomPercent: number;
    showGrid: boolean;
    showRulers: boolean;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFit: () => void;
  }

  let {
    zoomPercent,
    showGrid = $bindable(false),
    showRulers = $bindable(false),
    onZoomIn,
    onZoomOut,
    onFit
  }: Props = $props();
</script>

<div
  class="flex h-11 shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
>
  <div class="flex items-center gap-3">
    <span class="font-semibold text-slate-500 dark:text-slate-400">
      {$t('certificate_studio.zoom')}
    </span>
    <div
      class="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-800"
    >
      <Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={onZoomOut} title="Zoom Out">
        <ZoomOutIcon class="size-3.5" />
      </Button>
      <span class="min-w-10 text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
        {zoomPercent}%
      </span>
      <Button variant="ghost" size="sm" class="h-6 w-6 p-0" onclick={onZoomIn} title="Zoom In">
        <ZoomInIcon class="size-3.5" />
      </Button>
    </div>

    <Button variant="ghost" size="sm" class="h-7 gap-1 px-2 text-xs text-slate-600 dark:text-slate-400" onclick={onFit}>
      <Maximize2Icon class="size-3" />
      <span>Fit</span>
    </Button>
  </div>

  <div class="flex items-center gap-4">
    <!-- Grid Snap Toggle using @cio/ui/base/checkbox -->
    <div class="flex items-center gap-2">
      <Checkbox id="studio-grid-toggle" bind:checked={showGrid} />
      <Label
        for="studio-grid-toggle"
        class="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300"
      >
        <GridIcon class="size-3.5 text-slate-400" />
        <span>{$t('certificate_studio.grid')} ({$t('certificate_studio.snap')})</span>
      </Label>
    </div>

    <div class="h-3.5 w-px bg-slate-200 dark:bg-slate-800"></div>

    <!-- Rulers / Guides Toggle using @cio/ui/base/checkbox -->
    <div class="flex items-center gap-2">
      <Checkbox id="studio-rulers-toggle" bind:checked={showRulers} />
      <Label for="studio-rulers-toggle" class="cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300">
        <span>{$t('certificate_studio.rulers')}</span>
      </Label>
    </div>
  </div>
</div>
