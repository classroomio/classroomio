<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import QuoteIcon from '@lucide/svelte/icons/quote';
  import { t } from '$lib/utils/functions/translations';
  import { quoteInChat } from '$features/ai-assistant/utils/store';

  interface Props {
    root: HTMLElement | undefined;
    enabled?: boolean;
  }

  let { root = undefined, enabled = false }: Props = $props();

  let top = $state(0);
  let left = $state(0);
  let visible = $state(false);
  let picked = $state('');
  let dragging = false;
  let buttonEl: HTMLButtonElement | undefined = $state();

  function reset() {
    visible = false;
    picked = '';
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

    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);

    return el ? rootEl.contains(el) : false;
  }

  /** Re-evaluate selection and either reposition / show the chip or hide it. */
  function evaluate() {
    if (!browser || !enabled || !root) {
      reset();

      return;
    }

    const sel = window.getSelection();

    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      reset();

      return;
    }

    const range = sel.getRangeAt(0);

    if (!inRoot(root, range.commonAncestorContainer) && !inRoot(root, sel.anchorNode) && !inRoot(root, sel.focusNode)) {
      reset();

      return;
    }

    const raw = sel.toString();

    if (!raw.trim()) {
      reset();

      return;
    }

    const rect = endRect(range);

    if (!rect) {
      reset();

      return;
    }

    picked = raw;
    visible = true;

    const btn = 28;
    const pad = 6;
    const gap = 4;
    const desiredLeft = rect.right + gap;
    const desiredTop = rect.top + (rect.height - btn) / 2;

    left = Math.min(Math.max(pad, desiredLeft), window.innerWidth - btn - pad);
    top = Math.max(pad, Math.min(desiredTop, window.innerHeight - btn - pad));
  }

  /**
   * Selection-change handler: only used to *hide* the chip if the selection
   * collapses or moves out of the note. We never *show* the chip from here so
   * the chip can't appear (and thrash the DOM) mid-drag.
   */
  function onSelectionChange() {
    if (!visible) return;

    const sel = window.getSelection();

    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      reset();
    }
  }

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;

    const target = e.target as Node | null;

    if (buttonEl && target && buttonEl.contains(target)) {
      return;
    }

    dragging = true;

    if (visible) reset();
  }

  function onPointerUp() {
    if (!dragging) return;

    dragging = false;
    evaluate();
  }

  function onKeyUp(e: KeyboardEvent) {
    if (!e.shiftKey) return;

    evaluate();
  }

  function onScrollOrResize() {
    if (!visible) return;

    evaluate();
  }

  onMount(() => {
    if (!browser) return;

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('selectionchange', onSelectionChange);
    window.addEventListener('resize', onScrollOrResize);
    document.addEventListener('scroll', onScrollOrResize, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', onPointerUp, true);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('selectionchange', onSelectionChange);
      window.removeEventListener('resize', onScrollOrResize);
      document.removeEventListener('scroll', onScrollOrResize, true);
    };
  });

  function submit(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const text = picked;
    reset();
    window.getSelection()?.removeAllRanges();
    quoteInChat(text);
  }

  function portal(node: HTMLElement) {
    if (!browser) return;

    document.body.appendChild(node);

    return {
      destroy() {
        node.remove();
      }
    };
  }
</script>

<button
  type="button"
  bind:this={buttonEl}
  use:portal
  title={t.get('ai_assistant.quote_lesson_note')}
  aria-label={t.get('ai_assistant.quote_lesson_note')}
  aria-hidden={!visible}
  tabindex={visible ? 0 : -1}
  onpointerdown={(e) => e.preventDefault()}
  onmousedown={(e) => e.preventDefault()}
  onclick={submit}
  style:position="fixed"
  style:top="{top}px"
  style:left="{left}px"
  style:z-index="2147483000"
  style:opacity={visible ? '1' : '0'}
  style:visibility={visible ? 'visible' : 'hidden'}
  style:pointer-events={visible ? 'auto' : 'none'}
  class="ui:bg-secondary ui:text-secondary-foreground ui:border-border ui:hover:bg-accent inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border shadow-md transition-opacity"
>
  <QuoteIcon size={14} />
</button>
