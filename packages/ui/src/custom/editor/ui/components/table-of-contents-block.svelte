<script lang="ts">
  import { NodeViewWrapper } from 'svelte-tiptap';
  import type { NodeViewProps } from '@tiptap/core';
  import ListTreeIcon from '@lucide/svelte/icons/list-tree';
  import { createSubscriber } from 'svelte/reactivity';

  const { editor }: NodeViewProps = $props();

  type TocAnchor = {
    id: string;
    textContent: string;
    level: number;
    itemIndex: number;
  };

  const anchors = $derived.by(() => {
    if (!editor || editor.isDestroyed) {
      return [] as TocAnchor[];
    }

    const subscribeToTransactions = createSubscriber((update) => {
      const onTransaction = () => update();
      editor.on('transaction', onTransaction);
      onTransaction();
      return () => editor.off('transaction', onTransaction);
    });

    subscribeToTransactions();

    const storage = editor.storage.tableOfContents as { content?: TocAnchor[] } | undefined;
    return storage?.content ?? [];
  });

  function scrollToHeading(anchorId: string) {
    if (!editor || editor.isDestroyed) {
      return;
    }

    const element = editor.view.dom.querySelector(`[data-toc-id="${anchorId}"], [id="${anchorId}"]`);

    if (!(element instanceof HTMLElement)) {
      return;
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<NodeViewWrapper class="table-of-contents-block" contenteditable={false} data-drag-handle>
  <div class="table-of-contents-block__inner">
    <div class="table-of-contents-block__header">
      <ListTreeIcon size={14} class="ui:text-muted-foreground" />
      <span class="table-of-contents-block__title">Table of contents</span>
    </div>

    {#if anchors.length === 0}
      <p class="table-of-contents-block__empty">Add headings to build a table of contents.</p>
    {:else}
      <ul class="table-of-contents-block__list">
        {#each anchors as anchor (anchor.id)}
          <li class="table-of-contents-block__item" style={`--toc-level: ${anchor.level}`}>
            <button type="button" class="table-of-contents-block__link" onclick={() => scrollToHeading(anchor.id)}>
              {#if anchor.itemIndex > 0}
                <span class="table-of-contents-block__index">{anchor.itemIndex}.</span>
              {/if}
              {anchor.textContent}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</NodeViewWrapper>
