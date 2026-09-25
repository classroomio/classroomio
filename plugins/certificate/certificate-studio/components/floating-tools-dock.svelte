<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import LayoutIcon from '@lucide/svelte/icons/layout';
  import SquareIcon from '@lucide/svelte/icons/square';
  import TypeIcon from '@lucide/svelte/icons/type';
  import AwardIcon from '@lucide/svelte/icons/award';
  import QrCodeIcon from '@lucide/svelte/icons/qr-code';
  import PenToolIcon from '@lucide/svelte/icons/pen-tool';
  import PaletteIcon from '@lucide/svelte/icons/palette';
  import { t } from '$lib/utils/functions/translations';
  import type { ToolCategory } from '../types';

  interface Props {
    selectedTool: ToolCategory;
    onSelectTool: (tool: ToolCategory) => void;
  }

  let { selectedTool, onSelectTool }: Props = $props();

  const TOOLS = [
    { id: 'layout' as const, label: 'certificate_studio.tool_layout', icon: LayoutIcon },
    { id: 'borders' as const, label: 'certificate_studio.tool_borders', icon: SquareIcon },
    { id: 'typography' as const, label: 'certificate_studio.tool_typography', icon: TypeIcon },
    { id: 'badges' as const, label: 'certificate_studio.tool_badges', icon: AwardIcon },
    { id: 'qrcode' as const, label: 'certificate_studio.tool_qrcode', icon: QrCodeIcon },
    { id: 'signatories' as const, label: 'certificate_studio.tool_signatories', icon: PenToolIcon },
    { id: 'background' as const, label: 'certificate_studio.tool_background', icon: PaletteIcon }
  ];
</script>

<div
  class="pointer-events-auto absolute bottom-2 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl transition-all duration-200 dark:border-slate-800/90 dark:bg-slate-900/95"
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
            class="size-4.5 shrink-0 {selectedTool === tool.id
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
