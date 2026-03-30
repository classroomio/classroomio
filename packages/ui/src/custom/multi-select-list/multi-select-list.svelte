<script lang="ts">
  import { Spinner } from '../../base/spinner';
  import { CheckboxField } from '../checkbox-field';
  import { Search } from '../search';
  import { cn } from '../../tools';
  import type { MultiSelectListItem } from './types';
  import type { Snippet } from 'svelte';

  interface Props {
    /** When omitted, the list renders without a heading row (e.g. when the parent supplies the title). */
    heading?: string;
    headingSnippet?: Snippet;
    emptyMessage: string;
    items: MultiSelectListItem[];
    isLoading?: boolean;
    isSelected: (id: string) => boolean;
    onToggle: (id: string) => void;
    /** Prefix for each row's checkbox `name` (e.g. `assign-course` → `assign-course-<id>`). */
    namePrefix?: string;
    class?: string;
    /** Extra classes for the scrollable list container (`data-slot="multi-select-list-items"`). */
    listClass?: string;
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchValueChange?: (value: string) => void;
  }

  let {
    heading = '',
    headingSnippet,
    emptyMessage,
    items,
    isLoading = false,
    isSelected,
    onToggle,
    namePrefix = 'multi-select',
    class: className,
    listClass,
    searchPlaceholder = '',
    searchValue = $bindable(''),
    onSearchValueChange
  }: Props = $props();

  const hasHeading = $derived(heading || headingSnippet);
</script>

<div data-slot="multi-select-list" class={cn('ui:border-border ui:space-y-3 ui:rounded-md ui:border', className)}>
  {#if hasHeading || searchPlaceholder}
    <div
      class={cn(
        'ui:border-border ui:flex ui:gap-3 ui:border-b ui:px-2 ui:py-2 ui:items-center ui:justify-between',
        !hasHeading && 'ui:justify-end'
      )}
    >
      {#if heading}
        <p class="ui:text-sm ui:font-medium">
          {heading} ({items.length})
        </p>
      {:else if headingSnippet}
        {@render headingSnippet()}
      {/if}

      {#if searchPlaceholder}
        <Search
          placeholder={searchPlaceholder}
          bind:value={searchValue}
          onValueChange={onSearchValueChange}
          class="ui:w-full ui:max-w-sm"
        />
      {/if}
    </div>
  {/if}
  {#if isLoading}
    <div class="ui:flex ui:min-h-40 ui:items-center ui:justify-center ui:px-2 ui:pb-2">
      <Spinner class="ui:size-5 ui:text-muted-foreground" />
    </div>
  {:else if items.length === 0}
    <p class="ui:text-muted-foreground ui:px-2 ui:pb-2 ui:text-sm">{emptyMessage}</p>
  {:else}
    <div
      data-slot="multi-select-list-items"
      class={cn('ui:max-h-60 ui:space-y-2 ui:overflow-y-auto ui:px-2 ui:pb-2', listClass)}
    >
      {#each items as item (item.id)}
        <CheckboxField
          name={`${namePrefix}-${item.id}`}
          label={item.label || item.id}
          checked={isSelected(item.id)}
          onclick={() => onToggle(item.id)}
        >
          {#if item.description}
            <p class="ui:ml-2 ui:text-muted-foreground ui:text-sm">{item.description}</p>
          {/if}
        </CheckboxField>
      {/each}
    </div>
  {/if}
</div>
