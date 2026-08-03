<script lang="ts">
  import type { Snippet } from 'svelte';
  // Recursion: the component imports its own file. `svelte:self` is deprecated in Svelte 5,
  // and importing through `index.ts` would make the module graph circular.
  import Self from './comment-tree-node.svelte';
  import CollapseToggle from './comment-tree-collapse-toggle.svelte';
  import MoreReplies from './comment-tree-more-replies.svelte';
  import ThreadLine from './comment-tree-thread-line.svelte';
  import type { CommentTreeLabels, CommentTreeNodeData } from './types';

  interface Props {
    node: CommentTreeNodeData;
    /** Depth at which indenting stops and the thread is continued instead. */
    indentCap?: number;
    /** Pixels of indent per level. Applied inline so no dynamic class strings are needed. */
    indentStep?: number;
    isCollapsed: (id: number) => boolean;
    onToggleCollapse: (id: number) => void;
    onLoadMoreChildren?: (id: number) => void;
    onContinueThread?: (id: number) => void;
    labels: CommentTreeLabels;
    body: Snippet<[{ node: CommentTreeNodeData }]>;
    class?: string;
  }

  let {
    node,
    indentCap = 5,
    indentStep = 24,
    isCollapsed,
    onToggleCollapse,
    onLoadMoreChildren,
    onContinueThread,
    labels,
    body,
    class: className = ''
  }: Props = $props();

  const collapsed = $derived(isCollapsed(node.id));
  const hasBranch = $derived(node.directReplyCount > 0 || node.children.length > 0);
  const atCap = $derived(node.depth >= indentCap);
  const missingChildren = $derived(Math.max(node.directReplyCount - node.children.length, 0));
  const hiddenBelow = $derived(Math.max(node.descendantCount - node.children.length, 0));
  const childrenId = $derived(`comment-children-${node.id}`);
</script>

<div class="ui:relative ui:flex ui:w-full ui:flex-col ui:gap-1.5 {className}" data-depth={node.depth}>
  <div class="ui:flex ui:w-full ui:items-start ui:gap-1">
    {#if hasBranch}
      <CollapseToggle
        {collapsed}
        controls={childrenId}
        collapseLabel={labels.collapse}
        expandLabel={labels.expand}
        onclick={() => onToggleCollapse(node.id)}
        class="ui:mt-1.5"
      />
    {:else}
      <span class="ui:w-5 ui:shrink-0" aria-hidden="true"></span>
    {/if}
    <div class="ui:min-w-0 ui:flex-1">
      {@render body({ node })}
    </div>
  </div>

  {#if hasBranch && collapsed}
    <p class="ui:pl-6 ui:text-xs ui:text-muted-foreground">{labels.collapsedSummary(node.descendantCount)}</p>
  {:else if hasBranch}
    <div
      id={childrenId}
      class="ui:relative ui:flex ui:flex-col ui:gap-3"
      style:padding-left={`${atCap ? 0 : indentStep}px`}
    >
      <ThreadLine label={labels.collapse} onclick={() => onToggleCollapse(node.id)} />

      {#if atCap && onContinueThread}
        <MoreReplies kind="continue" label={labels.continueThread} onclick={() => onContinueThread(node.id)} />
      {:else}
        {#each node.children as child (child.id)}
          <Self
            node={child}
            {indentCap}
            {indentStep}
            {isCollapsed}
            {onToggleCollapse}
            {onLoadMoreChildren}
            {onContinueThread}
            {labels}
            {body}
          />
        {/each}

        {#if missingChildren > 0 && onLoadMoreChildren}
          <MoreReplies
            label={labels.moreReplies(hiddenBelow || missingChildren)}
            loading={node.isLoading}
            onclick={() => onLoadMoreChildren(node.id)}
          />
        {/if}
      {/if}
    </div>
  {/if}
</div>
