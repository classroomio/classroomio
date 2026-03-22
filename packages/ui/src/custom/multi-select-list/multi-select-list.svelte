<script lang="ts">
  import { CheckboxField } from '../checkbox-field';
  import { cn } from '../../tools';
  import type { MultiSelectListItem } from './types';

  interface Props {
    heading: string;
    emptyMessage: string;
    items: MultiSelectListItem[];
    isSelected: (id: string) => boolean;
    onToggle: (id: string) => void;
    /** Prefix for each row's checkbox `name` (e.g. `assign-course` → `assign-course-<id>`). */
    namePrefix?: string;
    class?: string;
    /** Extra classes for the scrollable list container (`data-slot="multi-select-list-items"`). */
    listClass?: string;
  }

  let {
    heading,
    emptyMessage,
    items,
    isSelected,
    onToggle,
    namePrefix = 'multi-select',
    class: className,
    listClass
  }: Props = $props();
</script>

<div data-slot="multi-select-list" class={cn('ui:border-border space-y-3 rounded-md border', className)}>
  <p class="ui:border-border border-b px-2 py-2 text-sm font-medium">
    {heading} ({items.length})
  </p>
  {#if items.length === 0}
    <p class="ui:text-muted-foreground px-2 pb-2 text-sm">{emptyMessage}</p>
  {:else}
    <div data-slot="multi-select-list-items" class={cn('max-h-60 space-y-2 overflow-y-auto px-2 pb-2', listClass)}>
      {#each items as item (item.id)}
        <CheckboxField
          name={`${namePrefix}-${item.id}`}
          label={item.label || item.id}
          checked={isSelected(item.id)}
          onclick={() => onToggle(item.id)}
        />
      {/each}
    </div>
  {/if}
</div>
