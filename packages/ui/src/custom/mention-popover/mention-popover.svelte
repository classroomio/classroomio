<script lang="ts">
  import { cn } from '../../tools';
  import type { MentionItem } from './types';
  import type { Snippet } from 'svelte';

  interface Props {
    items: MentionItem[];
    query: string;
    selectedIndex: number;
    onSelect: (item: MentionItem) => void;
    /** Custom icon snippet — receives `{ item }` and should render a small icon. */
    icon?: Snippet<[{ item: MentionItem }]>;
    /** Custom label for each item's type badge. */
    typeLabel?: (item: MentionItem) => string;
    emptyMessage?: string;
    class?: string;
  }

  let {
    items,
    query,
    selectedIndex,
    onSelect,
    icon,
    typeLabel,
    emptyMessage = 'No results',
    class: className
  }: Props = $props();

  const filteredItems = $derived(
    query ? items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())) : items
  );

  /**
   * Split a label into segments: plain text and highlighted matches.
   * Returns an array of `{ text, highlighted }` pairs for rendering.
   */
  function highlightSegments(label: string, search: string): Array<{ text: string; highlighted: boolean }> {
    if (!search) return [{ text: label, highlighted: false }];

    const lowerLabel = label.toLowerCase();
    const lowerSearch = search.toLowerCase();
    const matchIndex = lowerLabel.indexOf(lowerSearch);

    if (matchIndex === -1) return [{ text: label, highlighted: false }];

    const segments: Array<{ text: string; highlighted: boolean }> = [];

    if (matchIndex > 0) {
      segments.push({ text: label.slice(0, matchIndex), highlighted: false });
    }

    segments.push({ text: label.slice(matchIndex, matchIndex + search.length), highlighted: true });

    if (matchIndex + search.length < label.length) {
      segments.push({ text: label.slice(matchIndex + search.length), highlighted: false });
    }

    return segments;
  }
</script>

{#if filteredItems.length > 0}
  <div
    data-slot="mention-popover"
    class={cn(
      'ui:bg-popover ui:text-popover-foreground ui:max-h-52 ui:w-72 ui:overflow-y-auto ui:rounded-md ui:border ui:p-1 ui:shadow-md',
      className
    )}
    role="listbox"
  >
    {#each filteredItems as item, index (item.id)}
      <button
        role="option"
        aria-selected={index === selectedIndex}
        class={cn(
          'ui:flex ui:w-full ui:items-center ui:gap-2 ui:rounded-sm ui:px-2 ui:py-1.5 ui:text-left ui:text-sm ui:transition-colors',
          index === selectedIndex ? 'ui:bg-accent ui:text-accent-foreground' : 'hover:ui:bg-accent/50'
        )}
        onmousedown={(e) => {
          e.preventDefault();
          onSelect(item);
        }}
      >
        {#if icon}
          <span class="ui:shrink-0 ui:opacity-60">
            {@render icon({ item })}
          </span>
        {/if}
        <span class="ui:min-w-0 ui:flex-1 ui:truncate">
          {#each highlightSegments(item.label, query) as segment (segment.text + String(segment.highlighted))}
            {#if segment.highlighted}
              <mark class="ui:bg-primary/20 ui:text-foreground ui:rounded-sm">{segment.text}</mark>
            {:else}
              {segment.text}
            {/if}
          {/each}
        </span>
        {#if typeLabel}
          <span class="ui:text-muted-foreground ui:shrink-0 ui:text-xs">{typeLabel(item)}</span>
        {/if}
      </button>
    {/each}
  </div>
{:else if query}
  <div
    data-slot="mention-popover"
    class={cn(
      'ui:bg-popover ui:text-popover-foreground ui:w-72 ui:rounded-md ui:border ui:p-3 ui:shadow-md',
      className
    )}
  >
    <p class="ui:text-muted-foreground ui:text-sm">{emptyMessage}</p>
  </div>
{/if}
