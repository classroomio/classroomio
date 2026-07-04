<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import MessageSquarePlusIcon from '@lucide/svelte/icons/message-square-plus';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    root: HTMLElement | undefined;
    enabled?: boolean;
    onComment?: () => void;
  }

  let { root = undefined, enabled = false, onComment }: Props = $props();

  let top = $state(0);
  let left = $state(0);
  let visible = $state(false);
  let dragging = false;

  function reset() {
    visible = false;
  }

  function endRect(range: Range): DOMRect | null {
    const rects = range.getClientRects();

    if (rects.length > 0) {
      return rects[rects.length - 1];
    }

    const box = range.getBoundingClientRect();

    return box.width > 0 || box.height > 0 ? box : null;
  }

  function inRoot(rootEl: HTMLElement, node: Node | null): boolean {
    if (!node) return false;

    const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);

    return element ? rootEl.contains(element) : false;
  }

  function evaluate() {
    if (!browser || !enabled || !root) {
      reset();

      return;
    }

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      reset();

      return;
    }

    const range = selection.getRangeAt(0);

    if (
      !inRoot(root, range.commonAncestorContainer) &&
      !inRoot(root, selection.anchorNode) &&
      !inRoot(root, selection.focusNode)
    ) {
      reset();

      return;
    }

    if (!selection.toString().trim()) {
      reset();

      return;
    }

    const rect = endRect(range);

    if (!rect) {
      reset();

      return;
    }

    top = rect.bottom + window.scrollY + 8;
    left = rect.right + window.scrollX;
    visible = true;
  }

  onMount(() => {
    const handleSelectionChange = () => {
      if (dragging) return;

      evaluate();
    };

    const handleMouseDown = () => {
      dragging = true;
    };

    const handleMouseUp = () => {
      dragging = false;
      evaluate();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  });
</script>

{#if visible}
  <div class="pointer-events-none fixed z-[90]" style={`top:${top}px;left:${left}px;`}>
    <Button size="sm" class="pointer-events-auto shadow-md" onclick={() => onComment?.()}>
      <MessageSquarePlusIcon size={14} />
      {$t('notes.comments.add_inline')}
    </Button>
  </div>
{/if}
