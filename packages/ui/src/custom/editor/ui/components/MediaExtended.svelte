<script lang="ts">
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import { NodeViewWrapper } from 'svelte-tiptap';
  import type { NodeViewProps } from '@tiptap/core';
  import { cn } from '$src/tools';
  import { Button, buttonVariants } from '$src/base/button';

  import AlignCenter from '@lucide/svelte/icons/align-center';
  import AlignLeft from '@lucide/svelte/icons/align-left';
  import AlignRight from '@lucide/svelte/icons/align-right';
  import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import Fullscreen from '@lucide/svelte/icons/fullscreen';
  import Trash from '@lucide/svelte/icons/trash';
  import Captions from '@lucide/svelte/icons/captions';

  import * as DropdownMenu from '$src/base/dropdown-menu';
  import { duplicateContent } from '../../utils';

  interface MediaExtendedProps extends NodeViewProps {
    children: Snippet<[]>;
    mediaRef?: HTMLElement;
  }

  const {
    node,
    editor,
    selected,
    deleteNode,
    updateAttributes,
    children,
    mediaRef = $bindable()
  }: MediaExtendedProps = $props();

  const minWidthPercent = 15;
  const maxWidthPercent = 100;

  let nodeRef = $state<HTMLElement>();

  let resizing = $state(false);
  let resizingInitialWidthPercent = $state(0);
  let resizingInitialMouseX = $state(0);
  let resizingPosition = $state<'left' | 'right'>('left');
  let openedMore = $state(false);

  function handleResizingPosition(e: MouseEvent, position: 'left' | 'right') {
    startResize(e);
    resizingPosition = position;
  }

  function startResize(e: MouseEvent) {
    e.preventDefault();
    resizing = true;
    resizingInitialMouseX = e.clientX;
    if (mediaRef && nodeRef?.parentElement) {
      const currentWidth = mediaRef.offsetWidth;
      const parentWidth = nodeRef.parentElement.offsetWidth;
      resizingInitialWidthPercent = (currentWidth / parentWidth) * 100;
    }
  }

  function resize(e: MouseEvent) {
    if (!resizing || !nodeRef?.parentElement) return;
    let dx = e.clientX - resizingInitialMouseX;
    if (resizingPosition === 'left') {
      dx = resizingInitialMouseX - e.clientX;
    }
    const parentWidth = nodeRef.parentElement.offsetWidth;
    const deltaPercent = (dx / parentWidth) * 100;
    const newWidthPercent = Math.max(
      Math.min(resizingInitialWidthPercent + deltaPercent, maxWidthPercent),
      minWidthPercent
    );
    updateAttributes({ width: `${newWidthPercent}%` });
  }

  function endResize() {
    resizing = false;
    resizingInitialMouseX = 0;
    resizingInitialWidthPercent = 0;
  }

  function handleTouchStart(e: TouchEvent, position: 'left' | 'right') {
    e.preventDefault();
    resizing = true;
    resizingPosition = position;
    resizingInitialMouseX = e.touches[0].clientX;
    if (mediaRef && nodeRef?.parentElement) {
      const currentWidth = mediaRef.offsetWidth;
      const parentWidth = nodeRef.parentElement.offsetWidth;
      resizingInitialWidthPercent = (currentWidth / parentWidth) * 100;
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (!resizing || !nodeRef?.parentElement) return;
    let dx = e.touches[0].clientX - resizingInitialMouseX;
    if (resizingPosition === 'left') {
      dx = resizingInitialMouseX - e.touches[0].clientX;
    }
    const parentWidth = nodeRef.parentElement.offsetWidth;
    const deltaPercent = (dx / parentWidth) * 100;
    const newWidthPercent = Math.max(
      Math.min(resizingInitialWidthPercent + deltaPercent, maxWidthPercent),
      minWidthPercent
    );
    updateAttributes({ width: `${newWidthPercent}%` });
  }

  function handleTouchEnd() {
    resizing = false;
    resizingInitialMouseX = 0;
    resizingInitialWidthPercent = 0;
  }

  onMount(() => {
    // Attach id to nodeRef
    nodeRef = document.getElementById('resizable-container-media') as HTMLDivElement;

    // Mouse events
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', endResize);
    // Touch events
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  });

  onDestroy(() => {
    window.removeEventListener('mousemove', resize);
    window.removeEventListener('mouseup', endResize);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
  });
</script>

<!-- !FIXME: For some wierd reason, the change in `node.attrs.align` is not reactive to NodeViewWrapper 
 So for now, we'll re-render it when the align changes.
-->

{#key node.attrs.align}
  <NodeViewWrapper
    id="resizable-container-media"
    class={cn(
      'ui:relative ui:my-2 ui:flex ui:flex-col ui:rounded-md ui:border-2 ui:border-transparent',
      selected ? 'border-muted-foreground' : '',
      node.attrs.align === 'left' && 'left-0 -translate-x-0',
      node.attrs.align === 'center' && 'left-1/2 -translate-x-1/2',
      node.attrs.align === 'right' && 'left-full -translate-x-full'
    )}
    style={`width: ${node.attrs.width}`}
  >
    <div class={cn('ui:relative ui:flex ui:flex-col ui:rounded-md group', resizing && '')}>
      {@render children()}

      {#if editor.isEditable}
        <div
          role="button"
          tabindex="0"
          aria-label="Back"
          class="ui:absolute ui:inset-y-0 ui:z-20 ui:flex ui:w-[25px] ui:cursor-col-resize ui:items-center ui:justify-start ui:p-2"
          style="left: 0px"
          onmousedown={(event: MouseEvent) => {
            handleResizingPosition(event, 'left');
          }}
          ontouchstart={(event: TouchEvent) => {
            handleTouchStart(event, 'left');
          }}
        >
          <div
            class="ui:bg-muted ui:z-20 ui:h-[70px] ui:w-1 ui:rounded-xl ui:border ui:opacity-0 ui:transition-all ui:group-hover:opacity-100"
          ></div>
        </div>

        <div
          role="button"
          tabindex="0"
          aria-label="Back"
          class="ui:absolute ui:inset-y-0 ui:z-20 ui:flex ui:w-[25px] ui:cursor-col-resize ui:items-center ui:justify-end ui:p-2"
          style="right: 0px"
          onmousedown={(event: MouseEvent) => {
            handleResizingPosition(event, 'right');
          }}
          ontouchstart={(event: TouchEvent) => {
            handleTouchStart(event, 'right');
          }}
        >
          <div
            class="ui:bg-muted ui:z-20 ui:h-[70px] ui:w-1 ui:rounded-xl ui:border ui:opacity-0 ui:transition-all ui:group-hover:opacity-100"
          ></div>
        </div>
        <div
          class={cn(
            'ui:bg-background/50 ui:absolute ui:-top-2 ui:left-[calc(50%-3rem)] ui:flex ui:items-center ui:gap-1 ui:rounded ui:border ui:p-1 ui:opacity-0 ui:backdrop-blur-sm ui:transition-opacity',
            !resizing && 'group-hover:opacity-100',
            openedMore && 'opacity-100'
          )}
        >
          <Button
            variant="ghost"
            class={cn('ui:size-6 ui:p-0', node.attrs.align === 'left' && 'bg-muted')}
            onclick={() => updateAttributes({ align: 'left' })}
            title="Align Left"
          >
            <AlignLeft class="ui:size-4" />
          </Button>
          <Button
            variant="ghost"
            class={cn('ui:size-6 ui:p-0', node.attrs.align === 'center' && 'bg-muted')}
            onclick={() => updateAttributes({ align: 'center' })}
            title="Align Center"
          >
            <AlignCenter class="ui:size-4" />
          </Button>
          <Button
            variant="ghost"
            class={cn('ui:size-6 ui:p-0', node.attrs.align === 'right' && 'bg-muted')}
            onclick={() => updateAttributes({ align: 'right' })}
            title="Align Right"
          >
            <AlignRight class="ui:size-4" />
          </Button>
          <DropdownMenu.Root bind:open={openedMore} onOpenChange={(value) => (openedMore = value)}>
            <DropdownMenu.Trigger
              class={buttonVariants({ variant: 'ghost', class: 'size-6 p-0' })}
              title="More Options"
            >
              <EllipsisVertical class="ui:size-4" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start" alignOffset={-90} class="ui:mt-1 ui:overflow-auto ui:text-sm">
              <DropdownMenu.Item
                onclick={() => {
                  if (node.attrs.title === null || node.attrs.title.trim() === '')
                    updateAttributes({
                      title: 'Image Caption'
                    });
                }}
              >
                <Captions class="ui:mr-1 ui:size-4" /> Caption
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onclick={() => {
                  duplicateContent(editor, node);
                }}
              >
                <CopyIcon class="ui:mr-1 ui:size-4" /> Duplicate
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onclick={() => {
                  updateAttributes({
                    width: '100%'
                  });
                }}
              >
                <Fullscreen class="ui:mr-1 ui:size-4" /> Full Screen
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onclick={() => {
                  deleteNode();
                }}
                class="ui:text-destructive"
              >
                <Trash class="ui:mr-1 ui:size-4" /> Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      {/if}
    </div>
  </NodeViewWrapper>
{/key}
