<script lang="ts">
  import * as Command from '@cio/ui/base/command';
  import type { Component } from 'svelte';
  import type { SearchResultItem } from '../utils/types';

  interface Props {
    heading: string;
    items: SearchResultItem[];
    fallbackIcon: Component;
    onSelect: (item: SearchResultItem) => void;
  }

  let { heading, items, fallbackIcon, onSelect }: Props = $props();
</script>

{#if items.length > 0}
  <Command.Group {heading}>
    {#each items as item (item.kind + item.id)}
      {@const Icon = item.icon ?? fallbackIcon}
      <Command.Item value={`${item.kind}:${item.id}`} onSelect={() => onSelect(item)}>
        <Icon class="ui:size-4" />
        <div class="ui:min-w-0 ui:flex-1">
          <div class="ui:truncate ui:font-medium">{item.title}</div>
          {#if item.subtitle}
            <div class="ui:text-muted-foreground ui:truncate ui:text-xs">{item.subtitle}</div>
          {/if}
        </div>
      </Command.Item>
    {/each}
  </Command.Group>
{/if}
