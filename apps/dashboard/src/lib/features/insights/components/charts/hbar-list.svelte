<script lang="ts">
  import { cn } from '@cio/ui/tools';

  import type { InsightsTone } from '../../utils/types';

  interface Props {
    items: Array<{
      key: string;
      label: string;
      value: number | null;
      display: string;
      hint?: string;
      tone?: InsightsTone;
    }>;
    max?: number;
  }

  let { items, max = 100 }: Props = $props();

  const BAR_TONE_CLASS: Record<InsightsTone, string> = {
    success: 'bg-emerald-500/70',
    info: 'ui:bg-primary/70',
    warning: 'bg-amber-500/70',
    danger: 'bg-rose-500/70',
    muted: 'ui:bg-muted-foreground/40'
  };
</script>

<ul class="space-y-3">
  {#each items as item (item.key)}
    {@const width = item.value === null || max <= 0 ? 0 : Math.min(100, (item.value / max) * 100)}
    <li class="space-y-1">
      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="min-w-0 flex-1 truncate" title={item.label}>{item.label}</span>
        <span class="ui:text-muted-foreground shrink-0 tabular-nums">{item.display}</span>
      </div>
      <div class="ui:bg-muted h-2 overflow-hidden rounded-full">
        <div
          class={cn('h-full rounded-full transition-[width] duration-500', BAR_TONE_CLASS[item.tone ?? 'info'])}
          style="width: {width}%"
        ></div>
      </div>
      {#if item.hint}
        <p class="ui:text-muted-foreground text-xs">{item.hint}</p>
      {/if}
    </li>
  {/each}
</ul>
