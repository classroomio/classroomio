<script lang="ts">
  import { TONE_COLORS } from '../../utils/insights-utils';
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
          class="h-full rounded-full transition-[width] duration-500"
          style:width="{width}%"
          style:background-color={TONE_COLORS[item.tone ?? 'info']}
        ></div>
      </div>
      {#if item.hint}
        <p class="ui:text-muted-foreground text-xs">{item.hint}</p>
      {/if}
    </li>
  {/each}
</ul>
