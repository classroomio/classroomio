<script lang="ts">
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import HandIcon from '@lucide/svelte/icons/hand';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
  import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
  import PencilLineIcon from '@lucide/svelte/icons/pencil-line';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import * as DialogPrimitives from '../../base/dialog';
  import * as DropdownMenu from '../../base/dropdown-menu';
  import * as Popover from '../../base/popover';
  import { Button } from '../../base/button';
  import { Textarea } from '../../base/textarea';
  import { IconButton } from '../icon-button';
  import { cn } from '../../tools';
  import HtmlFrame from './block-html-frame.svelte';
  import type { HtmlBlockLabels, HtmlBlockSize } from './types';

  interface Props {
    src: string | null;
    downloadHref?: string;
    name: string;
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    editable?: boolean;
    generating?: boolean;
    labels: HtmlBlockLabels;
    onResize?: (size: HtmlBlockSize) => void;
    onChange?: () => void;
    onEditWithAi?: (prompt: string) => Promise<boolean>;
  }

  let {
    src,
    downloadHref,
    name,
    width = 100,
    height = 480,
    minWidth = 30,
    minHeight = 160,
    maxHeight = 2000,
    editable = false,
    generating = false,
    labels,
    onResize,
    onChange,
    onEditWithAi
  }: Props = $props();

  type ResizeEdge = 'left' | 'right' | 'bottom';

  const KEY_WIDTH_STEP = 5;
  const KEY_HEIGHT_STEP = 20;
  const RESIZE_KEYS: Record<ResizeEdge, { grow: string; shrink: string }> = {
    left: { grow: 'ArrowLeft', shrink: 'ArrowRight' },
    right: { grow: 'ArrowRight', shrink: 'ArrowLeft' },
    bottom: { grow: 'ArrowDown', shrink: 'ArrowUp' }
  };

  interface ResizeDrag {
    edge: ResizeEdge;
    startX: number;
    startY: number;
    startWidthPx: number;
    startHeight: number;
    columnWidth: number;
  }

  let root = $state<HTMLDivElement | null>(null);
  let surface = $state<HTMLDivElement | null>(null);
  let interactive = $state(false);
  let fullScreen = $state(false);
  let aiOpen = $state(false);
  let aiPrompt = $state('');
  let drag = $state<ResizeDrag | null>(null);
  let draftWidth = $state<number | null>(null);
  let draftHeight = $state<number | null>(null);

  const shownWidth = $derived(draftWidth ?? width);
  const shownHeight = $derived(draftHeight ?? height);
  const resizable = $derived(editable && !!onResize);

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  function handleWindowPointerDown(event: PointerEvent) {
    if (!interactive || !surface || surface.contains(event.target as Node)) return;

    interactive = false;
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !interactive) return;

    interactive = false;
  }

  function startResize(event: PointerEvent, edge: ResizeEdge) {
    if (!root?.parentElement) return;

    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag = {
      edge,
      startX: event.clientX,
      startY: event.clientY,
      startWidthPx: root.getBoundingClientRect().width,
      startHeight: shownHeight,
      columnWidth: root.parentElement.clientWidth
    };
  }

  function moveResize(event: PointerEvent) {
    if (!drag) return;

    if (drag.edge === 'bottom') {
      draftHeight = Math.round(clamp(drag.startHeight + event.clientY - drag.startY, minHeight, maxHeight));
      return;
    }

    const direction = drag.edge === 'right' ? 1 : -1;
    const widthPx = drag.startWidthPx + direction * 2 * (event.clientX - drag.startX);
    draftWidth = Math.round(clamp((widthPx / drag.columnWidth) * 100, minWidth, 100));
  }

  function endResize() {
    if (!drag) return;

    drag = null;
    const size = { width: shownWidth, height: shownHeight };
    draftWidth = null;
    draftHeight = null;
    if (size.width === width && size.height === height) return;

    onResize?.(size);
  }

  function resizeWithKeyboard(event: KeyboardEvent, edge: ResizeEdge) {
    const keys = RESIZE_KEYS[edge];
    if (event.key !== keys.grow && event.key !== keys.shrink) return;

    event.preventDefault();
    const direction = event.key === keys.grow ? 1 : -1;
    const size =
      edge === 'bottom'
        ? { width, height: clamp(height + direction * KEY_HEIGHT_STEP, minHeight, maxHeight) }
        : { width: clamp(width + direction * KEY_WIDTH_STEP, minWidth, 100), height };
    if (size.width === width && size.height === height) return;

    onResize?.(size);
  }

  async function submitAiPrompt() {
    const prompt = aiPrompt.trim();
    if (!prompt || generating || !onEditWithAi) return;

    aiOpen = false;
    const succeeded = await onEditWithAi(prompt);
    if (succeeded) aiPrompt = '';
  }

  function handleAiKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey) return;

    event.preventDefault();
    void submitAiPrompt();
  }
</script>

<svelte:window onpointerdown={handleWindowPointerDown} onkeydown={handleWindowKeydown} />

<div bind:this={root} class="ui:group/html ui:relative ui:mx-auto ui:max-w-full" style:width="{shownWidth}%">
  <div class="ui:flex ui:min-h-8 ui:items-center ui:gap-2 ui:pb-1">
    <p class="ui:text-muted-foreground ui:min-w-0 ui:flex-1 ui:truncate ui:text-sm" title={name}>{name}</p>

    <div
      class={cn(
        'ui:flex ui:shrink-0 ui:items-center ui:gap-1 ui:opacity-100 ui:transition ui:focus-within:opacity-100 ui:sm:opacity-0 ui:sm:group-hover/html:opacity-100',
        aiOpen && 'ui:sm:opacity-100'
      )}
    >
      {#if editable && onEditWithAi}
        <Popover.Root bind:open={aiOpen}>
          <Popover.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="secondary"
                size="icon-sm"
                disabled={generating}
                aria-label={labels.editWithAi}
                title={labels.editWithAi}
              >
                <SparklesIcon size={14} />
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content align="end" class="ui:w-80 ui:p-2">
            <form
              class="ui:flex ui:flex-col ui:gap-2"
              onsubmit={(event) => {
                event.preventDefault();
                void submitAiPrompt();
              }}
            >
              <Textarea
                bind:value={aiPrompt}
                rows={3}
                placeholder={labels.aiPlaceholder}
                aria-label={labels.editWithAi}
                class="ui:min-h-20 ui:resize-none ui:text-sm"
                onkeydown={handleAiKeydown}
              />
              <Button type="submit" size="sm" class="ui:self-end" disabled={!aiPrompt.trim()}>
                <ArrowUpIcon size={14} />
                {labels.aiSubmit}
              </Button>
            </form>
          </Popover.Content>
        </Popover.Root>
      {/if}

      <IconButton
        size="icon-sm"
        tooltip={labels.fullScreen}
        aria-label={labels.fullScreen}
        onclick={() => (fullScreen = true)}
      >
        <Maximize2Icon size={14} />
      </IconButton>

      {#if editable}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant="secondary" size="icon-sm" aria-label={labels.more} title={labels.more}>
                <MoreHorizontalIcon size={14} />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            {#if onChange}
              <DropdownMenu.Item disabled={generating} onSelect={onChange}>
                <PencilLineIcon size={14} />
                {labels.change}
              </DropdownMenu.Item>
            {/if}
            {#if downloadHref}
              <DropdownMenu.Item onSelect={() => window.open(downloadHref, '_blank', 'noopener')}>
                <DownloadIcon size={14} />
                {labels.download}
              </DropdownMenu.Item>
            {/if}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </div>
  </div>

  <div
    bind:this={surface}
    class={cn(
      'ui:border-border ui:relative ui:w-full ui:overflow-hidden ui:rounded-lg ui:border ui:bg-white',
      interactive && 'ui:ring-primary/40 ui:ring-2'
    )}
    style:height="{shownHeight}px"
  >
    {#if src}
      <HtmlFrame {src} title={labels.frameTitle} interactive={interactive && !drag} />
    {/if}

    {#if !interactive && !generating}
      <button
        type="button"
        class="ui:absolute ui:inset-0 ui:flex ui:cursor-pointer ui:items-center ui:justify-center ui:bg-transparent ui:transition-colors ui:hover:bg-black/10 ui:focus-visible:bg-black/10 ui:focus-visible:outline-none"
        aria-label={labels.interact}
        data-testid="html-block-interact"
        onclick={() => (interactive = true)}
      >
        <span
          class="ui:flex ui:items-center ui:gap-1.5 ui:rounded-full ui:bg-neutral-900/90 ui:px-3.5 ui:py-2 ui:text-sm ui:font-medium ui:text-white ui:opacity-0 ui:shadow-lg ui:transition ui:group-hover/html:opacity-100 ui:group-focus-within/html:opacity-100"
        >
          <HandIcon size={16} />
          {labels.interact}
        </span>
      </button>
    {/if}

    {#if generating}
      <div
        class="ui:bg-background/80 ui:absolute ui:inset-0 ui:flex ui:items-center ui:justify-center ui:gap-2 ui:backdrop-blur-sm"
        aria-live="polite"
      >
        <LoaderCircleIcon class="ui:text-muted-foreground ui:size-4 ui:animate-spin" />
        <span class="ui:text-muted-foreground ui:text-sm">{labels.generating}</span>
      </div>
    {/if}

    {#if resizable}
      {#each ['left', 'right'] as const as edge (edge)}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={labels.resizeWidth}
          aria-valuenow={shownWidth}
          aria-valuemin={minWidth}
          aria-valuemax={100}
          tabindex="0"
          class={cn(
            'ui:absolute ui:bottom-1 ui:z-10 ui:size-4 ui:touch-none ui:opacity-0 ui:transition ui:group-hover/html:opacity-100 ui:focus-visible:opacity-100',
            edge === 'left'
              ? 'ui:left-1 ui:cursor-nesw-resize ui:border-b-[3px] ui:border-l-[3px]'
              : 'ui:right-1 ui:cursor-nwse-resize ui:border-r-[3px] ui:border-b-[3px]',
            'ui:border-neutral-700',
            drag?.edge === edge && 'ui:opacity-100'
          )}
          onpointerdown={(event) => startResize(event, edge)}
          onpointermove={moveResize}
          onpointerup={endResize}
          onpointercancel={endResize}
          onkeydown={(event) => resizeWithKeyboard(event, edge)}
        ></div>
      {/each}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label={labels.resizeHeight}
        aria-valuenow={shownHeight}
        aria-valuemin={minHeight}
        aria-valuemax={maxHeight}
        tabindex="0"
        class={cn(
          'ui:absolute ui:bottom-1 ui:left-1/2 ui:z-10 ui:flex ui:h-3 ui:w-12 ui:-translate-x-1/2 ui:cursor-ns-resize ui:touch-none ui:items-center ui:justify-center ui:opacity-0 ui:transition ui:group-hover/html:opacity-100 ui:focus-visible:opacity-100',
          drag?.edge === 'bottom' && 'ui:opacity-100'
        )}
        onpointerdown={(event) => startResize(event, 'bottom')}
        onpointermove={moveResize}
        onpointerup={endResize}
        onpointercancel={endResize}
        onkeydown={(event) => resizeWithKeyboard(event, 'bottom')}
      >
        <span class="ui:h-1 ui:w-10 ui:rounded-full ui:bg-neutral-700/80"></span>
      </div>
    {/if}
  </div>
</div>

<DialogPrimitives.Root bind:open={fullScreen}>
  <DialogPrimitives.Content
    class="ui:flex ui:h-[92vh] ui:w-[96vw] ui:max-w-[96vw]! ui:flex-col ui:gap-3 ui:p-4 ui:md:max-w-[96vw]!"
  >
    <DialogPrimitives.Header>
      <DialogPrimitives.Title class="ui:truncate ui:pr-8 ui:text-sm ui:font-medium">{name}</DialogPrimitives.Title>
    </DialogPrimitives.Header>
    <div class="ui:border-border ui:min-h-0 ui:flex-1 ui:overflow-hidden ui:rounded-lg ui:border">
      {#if fullScreen}
        {#if src}
          <HtmlFrame {src} title={labels.frameTitle} interactive />
        {/if}
      {/if}
    </div>
  </DialogPrimitives.Content>
</DialogPrimitives.Root>
