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

  function getParentWidth(): number {
    if (!nodeRef) return 0;
    const parentContainer = nodeRef.closest('.edra-editor') || nodeRef.closest('.ProseMirror') || nodeRef.parentElement;
    return parentContainer
      ? (parentContainer as HTMLElement).clientWidth || (parentContainer as HTMLElement).offsetWidth
      : 0;
  }

  function handleResizingPosition(e: MouseEvent, position: 'left' | 'right') {
    startResize(e);
    resizingPosition = position;
  }

  function startResize(e: MouseEvent) {
    e.preventDefault();
    resizing = true;
    resizingInitialMouseX = e.clientX;
    const parentWidth = getParentWidth();
    if (mediaRef && parentWidth > 0) {
      const currentWidth = mediaRef.offsetWidth;
      resizingInitialWidthPercent = (currentWidth / parentWidth) * 100;
    }
  }

  function resize(e: MouseEvent) {
    if (!resizing || !nodeRef) return;
    const parentWidth = getParentWidth();
    if (parentWidth <= 0) return;

    let dx = e.clientX - resizingInitialMouseX;
    if (resizingPosition === 'left') {
      dx = resizingInitialMouseX - e.clientX;
    }
    const deltaPercent = (dx / parentWidth) * 100;
    const newWidthPercent = Math.max(
      Math.min(resizingInitialWidthPercent + deltaPercent, maxWidthPercent),
      minWidthPercent
    );
    updateAttributes({ width: `${Math.round(newWidthPercent)}%` });
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
    const parentWidth = getParentWidth();
    if (mediaRef && parentWidth > 0) {
      const currentWidth = mediaRef.offsetWidth;
      resizingInitialWidthPercent = (currentWidth / parentWidth) * 100;
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (!resizing || !nodeRef) return;
    const parentWidth = getParentWidth();
    if (parentWidth <= 0) return;

    let dx = e.touches[0].clientX - resizingInitialMouseX;
    if (resizingPosition === 'left') {
      dx = resizingInitialMouseX - e.touches[0].clientX;
    }
    const deltaPercent = (dx / parentWidth) * 100;
    const newWidthPercent = Math.max(
      Math.min(resizingInitialWidthPercent + deltaPercent, maxWidthPercent),
      minWidthPercent
    );
    updateAttributes({ width: `${Math.round(newWidthPercent)}%` });
  }

  function handleTouchEnd() {
    resizing = false;
    resizingInitialMouseX = 0;
    resizingInitialWidthPercent = 0;
  }

  onMount(() => {
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
    class={cn(
      'ui:relative ui:my-2 ui:flex ui:max-w-full ui:flex-col ui:rounded-md ui:border-2 ui:border-transparent ui:box-border',
      selected ? 'ui:border-muted-foreground' : '',
      node.attrs.align === 'left' && 'ui:mr-auto ui:ml-0',
      node.attrs.align === 'center' && 'ui:mx-auto',
      node.attrs.align === 'right' && 'ui:ml-auto ui:mr-0'
    )}
    style={`width: ${node.attrs.width || '100%'}; max-width: 100%;`}
  >
    <div
      bind:this={nodeRef}
      class={cn('ui:group ui:relative ui:flex ui:w-full ui:max-w-full ui:flex-col ui:rounded-md', resizing && '')}
    >
      {@render children()}

      {#if node.attrs.title !== null && node.attrs.title !== undefined && node.attrs.title !== ''}
        <input
          type="text"
          value={node.attrs.title}
          oninput={(e) => updateAttributes({ title: (e.target as HTMLInputElement).value })}
          placeholder="Add caption..."
          class="ui:mt-1 ui:w-full ui:bg-transparent ui:text-center ui:text-xs ui:text-muted-foreground ui:outline-none"
        />
      {/if}

      {#if editor.isEditable}
        <!-- Left resize handle -->
        <div
          role="button"
          tabindex="0"
          aria-label="Resize left"
          class="ui:absolute ui:inset-y-0 ui:left-0 ui:z-20 ui:flex ui:w-5 ui:cursor-col-resize ui:items-center ui:justify-start ui:p-1"
          onmousedown={(event: MouseEvent) => {
            handleResizingPosition(event, 'left');
          }}
          ontouchstart={(event: TouchEvent) => {
            handleTouchStart(event, 'left');
          }}
        >
          <div
            class={cn(
              'ui:bg-primary ui:z-20 ui:h-12 ui:w-1.5 ui:rounded-full ui:shadow-sm ui:transition-all',
              resizing && resizingPosition === 'left'
                ? 'ui:scale-110 ui:opacity-100'
                : 'ui:opacity-0 ui:group-hover:opacity-100'
            )}
          ></div>
        </div>

        <!-- Right resize handle -->
        <div
          role="button"
          tabindex="0"
          aria-label="Resize right"
          class="ui:absolute ui:inset-y-0 ui:right-0 ui:z-20 ui:flex ui:w-5 ui:cursor-col-resize ui:items-center ui:justify-end ui:p-1"
          onmousedown={(event: MouseEvent) => {
            handleResizingPosition(event, 'right');
          }}
          ontouchstart={(event: TouchEvent) => {
            handleTouchStart(event, 'right');
          }}
        >
          <div
            class={cn(
              'ui:bg-primary ui:z-20 ui:h-12 ui:w-1.5 ui:rounded-full ui:shadow-sm ui:transition-all',
              resizing && resizingPosition === 'right'
                ? 'ui:scale-110 ui:opacity-100'
                : 'ui:opacity-0 ui:group-hover:opacity-100'
            )}
          ></div>
        </div>

        <!-- Toolbar controls -->
        <div
          class={cn(
            'ui:bg-background/80 ui:absolute ui:-top-10 ui:left-1/2 ui:z-30 ui:flex ui:-translate-x-1/2 ui:items-center ui:gap-1 ui:rounded-md ui:border ui:p-1 ui:shadow-md ui:backdrop-blur-sm ui:opacity-0 ui:transition-opacity',
            !resizing && 'ui:group-hover:opacity-100',
            openedMore && 'ui:opacity-100'
          )}
        >
          <Button
            variant="ghost"
            class={cn('ui:size-6 ui:p-0', node.attrs.align === 'left' && 'ui:bg-muted')}
            onclick={() => updateAttributes({ align: 'left' })}
            title="Align Left"
          >
            <AlignLeft class="ui:size-4" />
          </Button>
          <Button
            variant="ghost"
            class={cn('ui:size-6 ui:p-0', node.attrs.align === 'center' && 'ui:bg-muted')}
            onclick={() => updateAttributes({ align: 'center' })}
            title="Align Center"
          >
            <AlignCenter class="ui:size-4" />
          </Button>
          <Button
            variant="ghost"
            class={cn('ui:size-6 ui:p-0', node.attrs.align === 'right' && 'ui:bg-muted')}
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
                  if (node.attrs.title === null || node.attrs.title === undefined || node.attrs.title.trim() === '') {
                    updateAttributes({
                      title: 'Image Caption'
                    });
                  } else {
                    updateAttributes({
                      title: null
                    });
                  }
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
                <Fullscreen class="ui:mr-1 ui:size-4" /> Full Width
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
