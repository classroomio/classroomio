<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import { cn } from '@cio/ui/tools';
  import { displayNoteTitle } from '../utils/doc-list-utils';
  import type { DocTreeNode } from '../utils/doc-tree-utils';
  import NoteSidebarTree from './doc-sidebar-tree.svelte';

  interface Props {
    nodes: DocTreeNode[];
    selectedNoteId?: string | null;
    expandedIds: Set<string>;
    depth?: number;
    noteHref: (docId: string) => string;
    onToggleExpanded: (docId: string) => void;
  }

  let {
    nodes,
    selectedNoteId = null,
    expandedIds,
    depth = 0,
    noteHref,
    onToggleExpanded
  }: Props = $props();

  function linkClass(docId: string) {
    return cn(
      'mx-2 flex items-center gap-1.5 rounded-md px-2 py-2 text-sm transition-colors',
      selectedNoteId === docId ? 'bg-primary/10 text-foreground' : 'ui:hover:bg-muted/60'
    );
  }
</script>

<ul>
  {#each nodes as node (node.id)}
    <li>
      <div class="flex items-stretch" style={`padding-left: ${depth * 12}px`}>
        {#if node.children.length > 0}
          <button
            type="button"
            class="ui:hover:bg-muted/60 mt-2 flex size-6 shrink-0 items-center justify-center rounded-md"
            aria-label={expandedIds.has(node.id) ? 'Collapse' : 'Expand'}
            onclick={() => onToggleExpanded(node.id)}
          >
            <ChevronRightIcon
              size={14}
              class={cn('ui:text-muted-foreground transition-transform', expandedIds.has(node.id) && 'rotate-90')}
            />
          </button>
        {:else}
          <span class="size-6 shrink-0"></span>
        {/if}

        <a href={noteHref(node.id)} class={cn(linkClass(node.id), 'min-w-0 flex-1')}>
          <FileTextIcon size={14} class="ui:text-muted-foreground mt-0.5 shrink-0" />
          <span class="line-clamp-2 leading-snug">{displayNoteTitle(node.title)}</span>
        </a>
      </div>

      {#if node.children.length > 0 && expandedIds.has(node.id)}
        <NoteSidebarTree
          nodes={node.children}
          {selectedNoteId}
          {expandedIds}
          depth={depth + 1}
          {noteHref}
          {onToggleExpanded}
        />
      {/if}
    </li>
  {/each}
</ul>
