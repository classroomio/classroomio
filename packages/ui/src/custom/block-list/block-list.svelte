<script lang="ts" generics="T extends { id: string }">
  import { onMount, tick, type Component, type Snippet } from 'svelte';
  import { flip } from 'svelte/animate';
  import { dragHandleZone } from 'svelte-dnd-action';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import XIcon from '@lucide/svelte/icons/x';
  import { Empty } from '../empty';
  import { AddContentMenu, type AddContentChoice } from '../add-content-menu';
  import { BlockSkyline } from '../animation/block-skyline';

  interface Props {
    items: T[];
    editable?: boolean;
    spacingClass?: string;
    addChoices?: AddContentChoice[];
    addLabel?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyIcon?: Component;
    emptyAction?: Snippet;
    renderItem: Snippet<[{ item: T; index: number; total: number; highlighted: boolean }]>;
    onAdd?: (type: string, index: number) => void;
    onReorder?: (items: T[]) => void;
    scrollRailLabel: string;
    goToBlockLabel: (index: number) => string;
    itemTitle?: (item: T, index: number) => string;
    dragHintLabel?: string;
    dismissHintLabel?: string;
    previewLabel?: string;
    storageKey?: string;
    highlightId?: string;
    showRail?: boolean;
  }

  let {
    items,
    editable = false,
    spacingClass = 'ui:gap-6',
    addChoices = [],
    addLabel = 'Add content',
    emptyTitle = 'No content',
    emptyDescription,
    emptyIcon,
    emptyAction,
    renderItem,
    onAdd,
    onReorder,
    scrollRailLabel,
    goToBlockLabel,
    itemTitle,
    dragHintLabel = 'Drag blocks to reorder them',
    dismissHintLabel = 'Dismiss',
    previewLabel,
    storageKey,
    highlightId,
    showRail: railEnabled = true
  }: Props = $props();

  const DOTS_AUTO_ACTIVE_SUPPRESSION_MS = 900;
  const HIGHLIGHT_MS = 1600;
  const DRAG_END_GRACE_MS = 250;
  const flipDurationMs = 180;

  let orderedItems = $state<T[]>([]);
  let dragging = $state(false);
  let activeItemId = $state('');
  let highlightedId = $state('');
  let rootElement = $state<HTMLDivElement | undefined>();
  let dragHintDismissed = $state(true);
  let activeMenuGapIndex = $state<number | null>(null);
  let suppressAutoActiveUntil = 0;
  let scrollFrame: number | undefined;

  const showRail = $derived(railEnabled && orderedItems.length > 0);
  const showDragHint = $derived(editable && !dragHintDismissed && orderedItems.length > 1);

  onMount(() => {
    const recoverInterruptedDrag = () => {
      window.setTimeout(() => {
        if (!dragging) return;

        dragging = false;
        orderedItems = items;
        activeMenuGapIndex = null;
      }, DRAG_END_GRACE_MS);
    };

    window.addEventListener('pointerup', recoverInterruptedDrag);
    window.addEventListener('pointercancel', recoverInterruptedDrag);
    window.addEventListener('blur', recoverInterruptedDrag);

    if (storageKey) {
      try {
        dragHintDismissed = localStorage.getItem(storageKey) === '1';
      } catch {
        dragHintDismissed = true;
      }
    } else {
      dragHintDismissed = false;
    }

    return () => {
      window.removeEventListener('pointerup', recoverInterruptedDrag);
      window.removeEventListener('pointercancel', recoverInterruptedDrag);
      window.removeEventListener('blur', recoverInterruptedDrag);
    };
  });

  $effect(() => {
    const nextItems = items;
    if (dragging) return;

    orderedItems = nextItems;
    if (nextItems.length > 0 && !activeItemId) {
      activeItemId = nextItems[0].id;
    }
  });

  $effect(() => {
    const nextHighlightId = highlightId;
    if (!nextHighlightId) return;

    highlightedId = nextHighlightId;
    void tick().then(() => {
      const element = rootElement?.querySelector<HTMLElement>(`[data-block-id="${nextHighlightId}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    const timeoutId = setTimeout(() => {
      if (highlightedId === nextHighlightId) highlightedId = '';
    }, HIGHLIGHT_MS);

    return () => clearTimeout(timeoutId);
  });

  function getReadingTop() {
    const pageRoot = rootElement?.closest('[data-slot="page"]');
    const header = pageRoot?.querySelector<HTMLElement>('[data-slot="page-header"]');
    if (!header) return 0;

    return Math.max(0, header.getBoundingClientRect().bottom);
  }

  function updateActiveItem(force = false) {
    if (!force && Date.now() < suppressAutoActiveUntil) return;

    const root = rootElement;
    if (!root) return;

    const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-block-item]'));
    if (elements.length === 0) return;

    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) {
      const lastItemId = elements[elements.length - 1]?.getAttribute('data-block-id');
      if (lastItemId) activeItemId = lastItemId;

      return;
    }

    const focusLine = Math.min(getReadingTop() + 24, window.innerHeight - 1);
    let nextActiveItemId = elements[0]?.getAttribute('data-block-id') ?? '';

    for (const element of elements) {
      if (element.getBoundingClientRect().top > focusLine) break;

      nextActiveItemId = element.getAttribute('data-block-id') ?? nextActiveItemId;
    }

    if (nextActiveItemId) activeItemId = nextActiveItemId;
  }

  function scheduleActiveItemUpdate(force = false) {
    if (scrollFrame !== undefined) return;

    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = undefined;
      updateActiveItem(force);
    });
  }

  $effect(() => {
    const root = rootElement;
    if (!root) return;

    const handleScroll = () => scheduleActiveItemUpdate();
    const handleResize = () => scheduleActiveItemUpdate(true);
    const handleUserScrollIntent = () => {
      suppressAutoActiveUntil = 0;
      scheduleActiveItemUpdate();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('wheel', handleUserScrollIntent, { passive: true });
    window.addEventListener('touchstart', handleUserScrollIntent, { passive: true });

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(root);

    scheduleActiveItemUpdate(true);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('wheel', handleUserScrollIntent);
      window.removeEventListener('touchstart', handleUserScrollIntent);
      resizeObserver.disconnect();

      if (scrollFrame !== undefined) {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = undefined;
      }
    };
  });

  $effect(() => {
    const renderKey = `${editable}:${orderedItems.map((item) => item.id).join(':')}`;
    if (!rootElement || !renderKey) return;

    void tick().then(() => scheduleActiveItemUpdate(true));
  });

  function dismissDragHint() {
    dragHintDismissed = true;
    if (!storageKey) return;

    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      return;
    }
  }

  function handleConsider(event: CustomEvent<{ items: T[] }>) {
    dragging = true;
    orderedItems = event.detail.items;
  }

  function handleFinalize(event: CustomEvent<{ items: T[] }>) {
    dragging = false;
    orderedItems = event.detail.items;
    onReorder?.(event.detail.items);
  }

  function selectGapType(type: string, index: number) {
    activeMenuGapIndex = null;
    onAdd?.(type, index);
  }

  function scrollToItem(itemId: string) {
    activeItemId = itemId;
    suppressAutoActiveUntil = Date.now() + DOTS_AUTO_ACTIVE_SUPPRESSION_MS;

    const element = rootElement?.querySelector<HTMLElement>(`[data-block-id="${itemId}"]`);
    if (!element) return;

    const targetTop = element.getBoundingClientRect().top + window.scrollY - getReadingTop() - 16;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }
</script>

{#snippet emptySkyline()}
  <BlockSkyline
    rows={4}
    class="ui:mx-auto ui:w-full ui:max-w-xs"
    toneClasses={{ muted: 'ui:bg-white', tint: 'ui:bg-primary/20', soft: 'ui:bg-primary/40', primary: 'ui:bg-primary' }}
  />
{/snippet}

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape') activeMenuGapIndex = null;
  }}
  onclick={() => {
    if (activeMenuGapIndex !== null) activeMenuGapIndex = null;
  }}
/>

<div bind:this={rootElement} class="ui:relative ui:mx-auto ui:w-full ui:max-w-4xl ui:overflow-visible">
  {#if showDragHint}
    <div
      class="ui:bg-muted/40 ui:text-muted-foreground ui:mb-4 ui:flex ui:items-center ui:gap-2 ui:rounded-lg ui:border ui:px-3 ui:py-2 ui:text-sm"
    >
      <GripVerticalIcon size={14} />
      <span class="ui:flex-1">{dragHintLabel}</span>
      <button
        type="button"
        class="ui:hover:text-foreground ui:rounded ui:p-1 ui:transition"
        aria-label={dismissHintLabel}
        onclick={dismissDragHint}
      >
        <XIcon size={14} />
      </button>
    </div>
  {/if}

  {#if orderedItems.length === 0}
    <Empty
      title={emptyTitle}
      description={editable ? emptyDescription : undefined}
      icon={emptyIcon}
      media={emptyIcon || !editable ? undefined : emptySkyline}
      variant="page"
      class="ui:mx-[5px] ui:w-auto ui:max-w-4xl! ui:text-center"
      contentClass="ui:max-w-none!"
    >
      {#if editable && emptyAction}
        {@render emptyAction()}
      {/if}
    </Empty>
  {:else}
    <div class="ui:relative ui:flex ui:items-start ui:gap-2">
      {#if showRail}
        <aside
          class="ui:fixed ui:top-1/2 ui:z-20 ui:hidden ui:shrink-0 ui:flex-col ui:items-center ui:gap-2 ui:p-1 ui:lg:-ml-10 ui:lg:flex"
          aria-label={scrollRailLabel}
        >
          {#each orderedItems as item, index (item.id)}
            <button
              type="button"
              onclick={() => scrollToItem(item.id)}
              aria-label={goToBlockLabel(index + 1)}
              aria-current={activeItemId === item.id ? 'true' : undefined}
              title={itemTitle?.(item, index)}
              class="ui:group/dot ui:cursor-pointer ui:flex ui:h-1.5 ui:w-1.5 ui:items-center ui:justify-center ui:transition-all {activeItemId ===
              item.id
                ? 'ui:my-1'
                : ''}"
            >
              <span
                class="ui:block ui:transition-all {activeItemId === item.id
                  ? 'ui:bg-primary ui:h-2 ui:w-1 ui:scale-125 ui:rounded-full'
                  : 'ui:bg-muted-foreground/40 ui:group-hover/dot:bg-muted-foreground ui:h-1.5 ui:w-1.5 ui:rounded-full'}"
              ></span>
            </button>
          {/each}
        </aside>
      {/if}

      <div class="ui:min-w-0 ui:flex-1">
        {#if editable}
          <section
            use:dragHandleZone={{
              items: orderedItems,
              flipDurationMs,
              dropFromOthersDisabled: true,
              dropTargetStyle: {
                border: '2px var(--ring) solid',
                'border-style': 'dashed',
                'border-radius': '0.75rem'
              }
            }}
            class="ui:flex ui:flex-col ui:px-2 ui:pt-1 ui:sm:px-4"
            onconsider={handleConsider}
            onfinalize={handleFinalize}
          >
            {#each orderedItems as item, index (item.id)}
              <div class="ui:relative ui:min-w-0" animate:flip={{ duration: flipDurationMs }}>
                {@render renderItem({
                  item,
                  index,
                  total: orderedItems.length,
                  highlighted: highlightedId === item.id
                })}

                {#if addChoices.length > 0}
                  <AddContentMenu
                    open={activeMenuGapIndex === index + 1}
                    choices={addChoices}
                    {addLabel}
                    onToggle={() => {
                      activeMenuGapIndex = activeMenuGapIndex === index + 1 ? null : index + 1;
                    }}
                    onClose={() => {
                      activeMenuGapIndex = null;
                    }}
                    onSelect={(type) => selectGapType(type, index + 1)}
                  />
                {/if}
              </div>
            {/each}
          </section>
        {:else}
          {#if previewLabel}
            <div class="ui:mb-4 ui:flex ui:items-center ui:justify-center">
              <span class="ui:text-muted-foreground ui:rounded-full ui:px-3 ui:py-1 ui:text-xs ui:font-medium">
                {previewLabel}
              </span>
            </div>
          {/if}
          <div class="ui:flex ui:flex-col {spacingClass}">
            {#each orderedItems as item, index (item.id)}
              <div class="ui:relative" animate:flip={{ duration: flipDurationMs }}>
                {@render renderItem({
                  item,
                  index,
                  total: orderedItems.length,
                  highlighted: highlightedId === item.id
                })}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
