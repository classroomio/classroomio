<script lang="ts">
  import type { Snippet } from 'svelte';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import type { StudioElementId, ToolCategory } from '../types';

  interface Props {
    id: StudioElementId;
    label: string;
    tool: ToolCategory;
    selected: boolean;
    hovered: boolean;
    offset?: number;
    left?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    width?: number | string;
    height?: number | string;
    isCircle?: boolean;
    onSelect: (id: StudioElementId, tool: ToolCategory) => void;
    onHover: (id: StudioElementId | null) => void;
    onNudge: (delta: number) => void;
    onReset?: () => void;
    children?: Snippet;
  }

  let {
    id,
    label,
    tool,
    selected,
    hovered,
    offset = 0,
    left,
    top,
    right,
    bottom,
    width,
    height,
    isCircle = false,
    onSelect,
    onHover,
    onNudge,
    onReset,
    children
  }: Props = $props();
</script>

<div
  role="button"
  tabindex="0"
  class="pointer-events-auto absolute z-30 cursor-pointer transition-all duration-150 {isCircle
    ? 'rounded-full'
    : 'rounded-xs'} {selected
    ? 'border-2 border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/20'
    : hovered
      ? 'border-2 border-dashed border-amber-400 bg-amber-400/10'
      : 'border border-transparent hover:border-amber-300/70 hover:bg-amber-300/5'}"
  style:left={typeof left === 'number' ? `${left}px` : left}
  style:top={typeof top === 'number' ? `${top}px` : top}
  style:right={typeof right === 'number' ? `${right}px` : right}
  style:bottom={typeof bottom === 'number' ? `${bottom}px` : bottom}
  style:width={typeof width === 'number' ? `${width}px` : width}
  style:height={typeof height === 'number' ? `${height}px` : height}
  onmouseenter={() => onHover(id)}
  onmouseleave={() => onHover(null)}
  onclick={(e) => {
    e.stopPropagation();
    onSelect(id, tool);
  }}
  onkeydown={(e) => {
    if (e.key === 'Enter') {
      onSelect(id, tool);
    }
  }}
  aria-label={label}
>
  <!-- Floating Tool / Nudge Pill -->
  {#if selected || hovered}
    <div
      class="pointer-events-auto absolute -top-4 {isCircle
        ? 'left-1/2 -translate-x-1/2'
        : 'left-2'} flex items-center gap-1.5 rounded bg-amber-600 px-2 py-0.5 text-[10px] font-bold tracking-wider whitespace-nowrap text-white uppercase shadow-md select-none"
    >
      <span>{label}</span>
      {#if offset !== 0}
        <span class="font-mono text-[9px] text-amber-200">
          {offset > 0 ? '+' : ''}{offset}px
        </span>
      {/if}
      <button
        type="button"
        class="rounded p-0.5 hover:bg-amber-700 active:scale-90"
        title="Nudge Up (Arrow Up)"
        onclick={(e) => {
          e.stopPropagation();
          onNudge(-4);
        }}
      >
        <ChevronUpIcon class="size-3.5" />
      </button>
      <button
        type="button"
        class="rounded p-0.5 hover:bg-amber-700 active:scale-90"
        title="Nudge Down (Arrow Down)"
        onclick={(e) => {
          e.stopPropagation();
          onNudge(4);
        }}
      >
        <ChevronDownIcon class="size-3.5" />
      </button>
      {#if offset !== 0 && onReset}
        <button
          type="button"
          class="ml-1 rounded px-1 text-[9px] underline hover:bg-amber-700"
          title="Reset Position"
          onclick={(e) => {
            e.stopPropagation();
            onReset();
          }}
        >
          Reset
        </button>
      {/if}
    </div>
  {/if}

  <!-- Corner Anchor Handles (Canva / Figma style) -->
  {#if selected}
    <span
      class="absolute -top-1.5 -left-1.5 size-3 border-2 border-amber-600 bg-white shadow-xs {isCircle
        ? 'rounded-full'
        : 'rounded-2xs'}"
    ></span>
    <span
      class="absolute -top-1.5 -right-1.5 size-3 border-2 border-amber-600 bg-white shadow-xs {isCircle
        ? 'rounded-full'
        : 'rounded-2xs'}"
    ></span>
    <span
      class="absolute -bottom-1.5 -left-1.5 size-3 border-2 border-amber-600 bg-white shadow-xs {isCircle
        ? 'rounded-full'
        : 'rounded-2xs'}"
    ></span>
    <span
      class="absolute -right-1.5 -bottom-1.5 size-3 border-2 border-amber-600 bg-white shadow-xs {isCircle
        ? 'rounded-full'
        : 'rounded-2xs'}"
    ></span>
  {/if}

  {@render children?.()}
</div>
