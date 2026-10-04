<script lang="ts">
  import type { Snippet } from 'svelte';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import AlignCenterIcon from '@lucide/svelte/icons/align-center';
  import AlignCenterVerticalIcon from '@lucide/svelte/icons/align-center-vertical';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { t } from '$lib/utils/functions/translations';
  import type { StudioElementId, ToolCategory, ResizeDirection } from '../types';

  interface Props {
    id: StudioElementId;
    label: string;
    tool: ToolCategory;
    selected: boolean;
    hovered: boolean;
    positionMode?: 'auto' | 'custom';
    x?: number;
    y?: number;
    left?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    width?: number | string;
    height?: number | string;
    isCircle?: boolean;
    canDelete?: boolean;
    onSelect: (id: StudioElementId, tool: ToolCategory) => void;
    onHover: (id: StudioElementId | null) => void;
    onCenterHorizontal?: (id: StudioElementId) => void;
    onCenterVertical?: (id: StudioElementId) => void;
    onResetAuto?: (id: StudioElementId) => void;
    onDelete?: (id: StudioElementId) => void;
    onStartDrag?: (e: PointerEvent, id: StudioElementId) => void;
    onStartResize?: (e: PointerEvent, id: StudioElementId, direction: ResizeDirection) => void;
    children?: Snippet;
  }

  let {
    id,
    label,
    tool,
    selected,
    hovered,
    positionMode = 'auto',
    x,
    y,
    left,
    top,
    right,
    bottom,
    width,
    height,
    isCircle = false,
    canDelete = true,
    onSelect,
    onHover,
    onCenterHorizontal,
    onCenterVertical,
    onResetAuto,
    onDelete,
    onStartDrag,
    onStartResize,
    children
  }: Props = $props();

  function handlePointerDown(e: PointerEvent) {
    if (e.button !== 0) return;

    // Don't drag if clicking buttons inside the toolbar or handles
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-resize-handle]')) return;

    e.preventDefault();
    onSelect(id, tool);
    if (onStartDrag) {
      onStartDrag(e, id);
    }
  }

  function handleResizePointerDown(e: PointerEvent, direction: ResizeDirection) {
    if (e.button !== 0) return;

    e.stopPropagation();
    e.preventDefault();
    onSelect(id, tool);
    if (onStartResize) {
      onStartResize(e, id, direction);
    }
  }
</script>

<div
  role="button"
  tabindex="0"
  class="pointer-events-auto absolute z-30 touch-none transition-all duration-75 select-none {isCircle
    ? 'rounded-full'
    : 'rounded-xs'} {selected
    ? 'cursor-grab border-2 border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/25'
    : hovered
      ? 'cursor-pointer border-2 border-dashed border-amber-400/90 bg-amber-400/10'
      : 'cursor-pointer border border-transparent hover:border-amber-300/70 hover:bg-amber-300/5'}"
  style:left={typeof left === 'number' ? `${left}px` : left}
  style:top={typeof top === 'number' ? `${top}px` : top}
  style:right={typeof right === 'number' ? `${right}px` : right}
  style:bottom={typeof bottom === 'number' ? `${bottom}px` : bottom}
  style:width={typeof width === 'number' ? `${width}px` : width}
  style:height={typeof height === 'number' ? `${height}px` : height}
  onmouseenter={() => onHover(id)}
  onmouseleave={() => onHover(null)}
  onpointerdown={handlePointerDown}
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
  <!-- Floating Tool / Canva-style Action Toolbar -->
  {#if selected || hovered}
    {@const isNearTop = typeof top === 'number' && top < 52}
    <div
      class="pointer-events-auto absolute {isNearTop ? '-bottom-11' : '-top-11'} {isCircle
        ? 'left-1/2 -translate-x-1/2'
        : 'left-0'} z-50 flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/95 px-3.5 py-1.5 shadow-2xl ring-1 ring-white/10 backdrop-blur-md select-none"
    >
      <!-- Drag Grip Handle -->
      <span
        class="flex cursor-grab items-center text-slate-400 hover:text-white active:cursor-grabbing"
        title={$t('certificate_studio.drag_to_move')}
      >
        <GripVerticalIcon class="size-4" />
      </span>

      <span class="text-xs font-bold tracking-wide whitespace-nowrap text-amber-300 uppercase">{label}</span>

      <!-- Position Mode Indicator -->
      {#if positionMode === 'custom' && x != null && y != null}
        <span class="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-200">
          {Math.round(x)}, {Math.round(y)}
        </span>
      {:else}
        <span class="rounded-md bg-slate-800/90 px-2 py-0.5 text-[11px] font-medium text-slate-300">
          {$t('certificate_studio.pos_mode_auto')}
        </span>
      {/if}

      <!-- Center Horizontally Action -->
      {#if onCenterHorizontal}
        <button
          type="button"
          class="flex size-6.5 items-center justify-center rounded-md text-slate-200 transition-colors hover:bg-slate-800 hover:text-white active:scale-95"
          title={$t('certificate_studio.center_horizontally')}
          aria-label={$t('certificate_studio.center_horizontally')}
          onclick={(e) => {
            e.stopPropagation();
            onCenterHorizontal(id);
          }}
        >
          <AlignCenterIcon class="size-4" />
        </button>
      {/if}

      {#if onCenterVertical}
        <button
          type="button"
          class="flex size-6.5 items-center justify-center rounded-md text-slate-200 transition-colors hover:bg-slate-800 hover:text-white active:scale-95"
          title={$t('certificate_studio.center_vertically')}
          aria-label={$t('certificate_studio.center_vertically')}
          onclick={(e) => {
            e.stopPropagation();
            onCenterVertical(id);
          }}
        >
          <AlignCenterVerticalIcon class="size-4" />
        </button>
      {/if}

      <!-- Reset to Auto Layout Action -->
      {#if positionMode === 'custom' && onResetAuto}
        <button
          type="button"
          class="flex size-6.5 items-center justify-center rounded-md text-slate-200 transition-colors hover:bg-slate-800 hover:text-white active:scale-95"
          title={$t('certificate_studio.reset_position')}
          aria-label={$t('certificate_studio.reset_position')}
          onclick={(e) => {
            e.stopPropagation();
            onResetAuto(id);
          }}
        >
          <RotateCcwIcon class="size-3.5" />
        </button>
      {/if}

      <!-- Delete / Hide Action -->
      {#if canDelete && onDelete}
        <button
          type="button"
          class="flex size-6.5 items-center justify-center rounded-md text-red-400 transition-colors hover:bg-red-950/80 hover:text-red-300 active:scale-95"
          title={$t('certificate_studio.hide_element')}
          aria-label={$t('certificate_studio.hide_element')}
          onclick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
        >
          <Trash2Icon class="size-3.5" />
        </button>
      {/if}
    </div>
  {/if}

  <!-- Prominent Corner & Edge Control Anchor Handles (Canva / Figma style) -->
  {#if selected}
    <!-- 4 Corner Anchors -->
    <div
      role="button"
      tabindex="0"
      data-resize-handle="nw"
      class="pointer-events-auto absolute -top-2 -left-2 size-4 cursor-nwse-resize border-2 border-amber-600 bg-white shadow-md ring-1 ring-black/10 transition-transform hover:scale-125 active:scale-125 dark:border-amber-400 dark:bg-slate-900 {isCircle
        ? 'rounded-full'
        : 'rounded-xs'}"
      aria-label="Resize Top-Left"
      onpointerdown={(e) => handleResizePointerDown(e, 'nw')}
    ></div>
    <div
      role="button"
      tabindex="0"
      data-resize-handle="ne"
      class="pointer-events-auto absolute -top-2 -right-2 size-4 cursor-nesw-resize border-2 border-amber-600 bg-white shadow-md ring-1 ring-black/10 transition-transform hover:scale-125 active:scale-125 dark:border-amber-400 dark:bg-slate-900 {isCircle
        ? 'rounded-full'
        : 'rounded-xs'}"
      aria-label="Resize Top-Right"
      onpointerdown={(e) => handleResizePointerDown(e, 'ne')}
    ></div>
    <div
      role="button"
      tabindex="0"
      data-resize-handle="sw"
      class="pointer-events-auto absolute -bottom-2 -left-2 size-4 cursor-nesw-resize border-2 border-amber-600 bg-white shadow-md ring-1 ring-black/10 transition-transform hover:scale-125 active:scale-125 dark:border-amber-400 dark:bg-slate-900 {isCircle
        ? 'rounded-full'
        : 'rounded-xs'}"
      aria-label="Resize Bottom-Left"
      onpointerdown={(e) => handleResizePointerDown(e, 'sw')}
    ></div>
    <div
      role="button"
      tabindex="0"
      data-resize-handle="se"
      class="pointer-events-auto absolute -right-2 -bottom-2 size-4 cursor-nwse-resize border-2 border-amber-600 bg-white shadow-md ring-1 ring-black/10 transition-transform hover:scale-125 active:scale-125 dark:border-amber-400 dark:bg-slate-900 {isCircle
        ? 'rounded-full'
        : 'rounded-xs'}"
      aria-label="Resize Bottom-Right"
      onpointerdown={(e) => handleResizePointerDown(e, 'se')}
    ></div>

    <!-- 4 Mid-Edge Pill Handles (for rectangular elements) -->
    {#if !isCircle}
      <div
        role="button"
        tabindex="0"
        data-resize-handle="top"
        class="pointer-events-auto absolute -top-1.5 left-1/2 h-2.5 w-6 -translate-x-1/2 cursor-ns-resize rounded-full border-2 border-amber-600 bg-white shadow-md ring-1 ring-black/10 transition-transform hover:scale-110 active:scale-110 dark:border-amber-400 dark:bg-slate-900"
        aria-label="Resize Top Edge"
        onpointerdown={(e) => handleResizePointerDown(e, 'top')}
      ></div>
      <div
        role="button"
        tabindex="0"
        data-resize-handle="bottom"
        class="pointer-events-auto absolute -bottom-1.5 left-1/2 h-2.5 w-6 -translate-x-1/2 cursor-ns-resize rounded-full border-2 border-amber-600 bg-white shadow-md ring-1 ring-black/10 transition-transform hover:scale-110 active:scale-110 dark:border-amber-400 dark:bg-slate-900"
        aria-label="Resize Bottom Edge"
        onpointerdown={(e) => handleResizePointerDown(e, 'bottom')}
      ></div>
      <div
        role="button"
        tabindex="0"
        data-resize-handle="left"
        class="pointer-events-auto absolute top-1/2 -left-1.5 h-6 w-2.5 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-amber-600 bg-white shadow-md ring-1 ring-black/10 transition-transform hover:scale-110 active:scale-110 dark:border-amber-400 dark:bg-slate-900"
        aria-label="Resize Left Edge"
        onpointerdown={(e) => handleResizePointerDown(e, 'left')}
      ></div>
      <div
        role="button"
        tabindex="0"
        data-resize-handle="right"
        class="pointer-events-auto absolute top-1/2 -right-1.5 h-6 w-2.5 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-amber-600 bg-white shadow-md ring-1 ring-black/10 transition-transform hover:scale-110 active:scale-110 dark:border-amber-400 dark:bg-slate-900"
        aria-label="Resize Right Edge"
        onpointerdown={(e) => handleResizePointerDown(e, 'right')}
      ></div>
    {/if}
  {/if}

  {@render children?.()}
</div>
