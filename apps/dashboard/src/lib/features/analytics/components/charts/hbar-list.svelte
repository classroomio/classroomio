<script lang="ts">
  import { TONE_COLORS } from '../../utils/analytics-utils';
  import type { AnalyticsTone } from '../../utils/types';

  type Item = {
    key: string;
    label: string;
    value: number | null;
    display: string;
    hint?: string;
    tone?: AnalyticsTone;
  };

  interface Props {
    items: Item[];
    max?: number;
    onSelect?: (key: string) => void;
  }

  let { items, max = 100, onSelect }: Props = $props();
</script>

{#snippet bar(item: Item)}
  {@const width = item.value === null || max <= 0 ? 0 : Math.min(100, (item.value / max) * 100)}
  <div class="space-y-1">
    <div class="flex items-center justify-between gap-3 text-sm">
      <span class="min-w-0 flex-1 truncate text-left" title={item.label}>{item.label}</span>
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
      <p class="ui:text-muted-foreground text-left text-xs">{item.hint}</p>
    {/if}
  </div>
{/snippet}

<ul class="space-y-3">
  {#each items as item (item.key)}
    <li>
      {#if onSelect}
        <button
          type="button"
          class="ui:hover:bg-muted/60 ui:focus-visible:ring-ring -mx-2 block w-[calc(100%+1rem)] cursor-pointer rounded-md px-2 py-1 focus-visible:ring-2 focus-visible:outline-none"
          data-testid="analytics-segment-{item.key}"
          onclick={() => onSelect(item.key)}
        >
          {@render bar(item)}
        </button>
      {:else}
        {@render bar(item)}
      {/if}
    </li>
  {/each}
</ul>
