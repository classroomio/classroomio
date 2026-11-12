<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { page } from '$app/state';
  import { startResizablePanelDrag } from '$lib/utils/functions/resizable-panel';
  import { t } from '$lib/utils/functions/translations';
  import MoveDiagonal2Icon from '@lucide/svelte/icons/move-diagonal-2';
  import { sidePanel } from './utils/store.svelte';
  import { clampFloatingRect, getViewport, startFloatingResize } from './utils/floating';

  interface Props {
    /**
     * Live-resize hook. The host writes `--side-panel-width` directly to the
     * shared shell element so the panel and fixed siblings (e.g. the Ask AI
     * bar) follow the drag without a per-frame reactivity round-trip.
     */
    onWidthPreview?: (width: number) => void;
  }

  let { onWidthPreview }: Props = $props();

  let railWidth = $state(0);
  let isWidthLoaded = $state(false);
  let isRailResizing = $state(false);
  let stopRailResize: (() => void) | null = null;

  const activeDefinition = $derived(sidePanel.activeDefinition);
  const activeProps = $derived(sidePanel.panelProps);
  const effectiveIsFloating = $derived(sidePanel.isFloating);
  const floatingRect = $derived(sidePanel.floatingRect);
  let isFloatingResizeActive = $state(false);
  let stopFloatingResize: (() => void) | null = null;

  function clampWidth(width: number) {
    const def = activeDefinition;
    if (!def) return width;

    return Math.min(def.maxWidth, Math.max(def.minWidth, width));
  }

  function clearResizeListeners() {
    stopRailResize?.();
    stopRailResize = null;
  }

  function loadWidthForDefinition(def: typeof activeDefinition): number {
    if (!def) return 0;

    try {
      const stored = Number(localStorage.getItem(def.widthStorageKey));
      if (Number.isFinite(stored) && stored > 0) {
        return Math.min(def.maxWidth, Math.max(def.minWidth, stored));
      }
    } catch {
      // localStorage unavailable
    }

    return def.defaultWidth;
  }

  function persistWidthForDefinition(def: typeof activeDefinition, width: number) {
    if (!def) return;

    try {
      localStorage.setItem(def.widthStorageKey, String(Math.round(width)));
    } catch {
      // localStorage unavailable
    }
  }

  $effect(() => {
    const def = activeDefinition;
    if (!def) {
      railWidth = 0;
      isWidthLoaded = false;

      return;
    }

    railWidth = loadWidthForDefinition(def);
    isWidthLoaded = true;
  });

  // Publish the effective width so the shared ancestor can expose it as a CSS
  // variable that fixed siblings (e.g. the Ask AI bar) can offset against.
  $effect(() => {
    sidePanel.width = activeDefinition && !effectiveIsFloating ? railWidth : 0;
  });

  $effect(() => {
    if (!isWidthLoaded) return;

    persistWidthForDefinition(activeDefinition, railWidth);
  });

  // Lesson-scoped panels should not survive navigating to a different lesson.
  // The rail owns this so host layouts don't have to wire it up themselves.
  let lastLessonId: string | undefined = undefined;

  $effect(() => {
    const lessonId = page.params?.lessonId as string | undefined;

    if (lastLessonId !== undefined && lessonId !== lastLessonId) {
      sidePanel.closeIfScope('lesson');
    }

    lastLessonId = lessonId;
  });

  function handleResizePointerDown(event: PointerEvent) {
    if (!activeDefinition || effectiveIsFloating) return;

    event.preventDefault();
    event.stopPropagation();

    clearResizeListeners();

    const startWidth = railWidth;

    stopRailResize = startResizablePanelDrag({
      event,
      startWidth,
      resolveWidth: ({ startWidth, deltaX }) => clampWidth(startWidth - deltaX),
      onPreview: (width) => {
        onWidthPreview?.(width);
      },
      onCommit: ({ width }) => {
        railWidth = width;
      },
      onDragStart: () => {
        isRailResizing = true;
      },
      onDragEnd: () => {
        isRailResizing = false;
        stopRailResize = null;
      }
    });
  }

  function clearFloatingResizeListeners() {
    stopFloatingResize?.();
    stopFloatingResize = null;
  }

  function handleFloatingResizePointerDown(event: PointerEvent) {
    const def = activeDefinition;
    const rect = floatingRect;
    if (!def || !rect || !effectiveIsFloating) return;

    event.preventDefault();
    event.stopPropagation();
    clearFloatingResizeListeners();

    stopFloatingResize = startFloatingResize({
      event,
      rect,
      definition: def,
      onPreview: (nextRect) => {
        sidePanel.updateFloatingRect(nextRect, false);
      },
      onCommit: (nextRect) => {
        sidePanel.updateFloatingRect(nextRect, true);
        isFloatingResizeActive = false;
        stopFloatingResize = null;
      },
      onCancel: () => {
        isFloatingResizeActive = false;
        stopFloatingResize = null;
      }
    });
    isFloatingResizeActive = true;
  }

  function handleViewportResize() {
    const def = activeDefinition;
    const rect = floatingRect;
    if (!def || !rect || !effectiveIsFloating) return;

    const viewport = getViewport();
    const clamped = clampFloatingRect(rect, def, viewport);
    if (
      clamped.x !== rect.x ||
      clamped.y !== rect.y ||
      clamped.width !== rect.width ||
      clamped.height !== rect.height
    ) {
      sidePanel.updateFloatingRect(clamped, true);
    }
  }

  onMount(() => {
    window.addEventListener('resize', handleViewportResize);

    return () => {
      window.removeEventListener('resize', handleViewportResize);
      clearResizeListeners();
      clearFloatingResizeListeners();
    };
  });

  onDestroy(() => {
    clearResizeListeners();
    clearFloatingResizeListeners();
    sidePanel.reset();
  });
</script>

{#if activeDefinition}
  {@const def = activeDefinition}
  <div
    data-side-panel-resizing={isRailResizing || isFloatingResizeActive || sidePanel.isFloatingDragging}
    class="contents"
  >
    {#if !effectiveIsFloating}
      <div class="hidden shrink-0 md:block md:w-(--side-panel-width)"></div>
    {/if}

    {#if sidePanel.showDockHint && effectiveIsFloating}
      <div
        class="ui:border-primary ui:bg-primary/5 pointer-events-none fixed top-[63px] right-3 bottom-3 hidden w-[380px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed md:flex"
        aria-hidden="true"
      >
        <span class="ui:text-primary text-sm font-medium">{$t('side_panel.floating.dock_hint')}</span>
      </div>
    {/if}

    <aside
      class={effectiveIsFloating
        ? 'ui:bg-background ui:z-app-bar-elevated fixed flex flex-col overflow-hidden rounded-2xl border shadow-2xl'
        : 'ui:bg-background ui:z-app-bar fixed inset-y-0 right-0 flex h-screen w-full flex-col border-l md:w-(--side-panel-width)'}
      style={effectiveIsFloating && floatingRect
        ? `left:${floatingRect.x}px;top:${floatingRect.y}px;width:${floatingRect.width}px;height:${floatingRect.height}px;`
        : undefined}
      aria-label={t.get(def.titleKey)}
      data-floating={effectiveIsFloating}
    >
      {#if !effectiveIsFloating}
        <button
          type="button"
          aria-label={t.get('side_panel.resize_panel_aria_label')}
          class="absolute inset-y-0 left-0 hidden w-2 -translate-x-1/2 cursor-col-resize border-0 bg-transparent md:flex"
          onpointerdown={handleResizePointerDown}
        >
          <span class="pointer-events-none h-full w-px"></span>
        </button>
      {/if}

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        {#key def.id}
          <def.component {...activeProps} />
        {/key}
      </div>

      {#if effectiveIsFloating}
        <button
          type="button"
          aria-label={t.get('side_panel.floating.resize_aria')}
          class="ui:text-muted-foreground absolute right-0 bottom-0 flex h-6 w-6 cursor-nwse-resize items-center justify-center border-0 bg-transparent p-1"
          onpointerdown={handleFloatingResizePointerDown}
        >
          <MoveDiagonal2Icon size={10} />
        </button>
      {/if}
    </aside>
  </div>
{/if}

<style>
  :global([data-side-panel-resizing='true'] *) {
    transition-property: none !important;
  }
</style>
