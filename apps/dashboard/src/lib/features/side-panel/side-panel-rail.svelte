<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { page } from '$app/state';
  import { startResizablePanelDrag } from '$lib/utils/functions/resizable-panel';
  import { t } from '$lib/utils/functions/translations';
  import { sidePanel } from './utils/store.svelte';

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
    sidePanel.width = activeDefinition ? railWidth : 0;
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
    if (!activeDefinition) return;

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

  onMount(() => {
    return () => {
      clearResizeListeners();
    };
  });

  onDestroy(() => {
    clearResizeListeners();
    sidePanel.reset();
  });
</script>

{#if activeDefinition}
  {@const def = activeDefinition}
  <div data-side-panel-resizing={isRailResizing} class="contents">
    <div class="hidden shrink-0 md:block md:w-(--side-panel-width)"></div>

    <aside
      class="ui:bg-background fixed inset-y-0 right-0 z-100 flex h-screen w-full flex-col border-l md:w-(--side-panel-width)"
      aria-label={t.get(def.titleKey)}
    >
      <button
        type="button"
        aria-label={t.get('side_panel.resize_panel_aria_label')}
        class="absolute inset-y-0 left-0 hidden w-4 -translate-x-1/2 cursor-col-resize border-0 bg-transparent md:flex"
        onpointerdown={handleResizePointerDown}
      >
        <span class="ui:bg-border pointer-events-none h-full w-px"></span>
      </button>

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        {#key def.id}
          <def.component {...activeProps} />
        {/key}
      </div>
    </aside>
  </div>
{/if}

<style>
  :global([data-side-panel-resizing='true'] *) {
    transition-property: none !important;
  }
</style>
