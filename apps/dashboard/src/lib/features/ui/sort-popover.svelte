<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import * as ToggleGroup from '@cio/ui/base/toggle-group';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import { t } from '$lib/utils/functions/translations';
  import type { Snippet } from 'svelte';

  export interface SortOption {
    label: string;
    value: string;
  }

  interface Props {
    sortOptions: SortOption[];
    sortKey?: string;
    selectedOrder?: 'asc' | 'desc';
    defaultSortKey?: string;
    defaultSortOrder?: 'asc' | 'desc';
    isFiltering?: boolean;
    hasActiveFilters?: boolean;
    title?: string;
    onClearFilters?: () => void | Promise<void>;
    onSortKeyChange?: (key: string) => void;
    onOrderChange?: (order: 'asc' | 'desc') => void;
    additionalContent?: Snippet;
  }

  let {
    sortOptions,
    sortKey = $bindable(''),
    selectedOrder = $bindable('desc'),
    defaultSortKey = '',
    defaultSortOrder = 'desc',
    isFiltering = false,
    hasActiveFilters,
    title,
    onClearFilters = () => {},
    onSortKeyChange,
    onOrderChange,
    additionalContent
  }: Props = $props();

  let isOpen = $state(false);

  const isActive = $derived(
    hasActiveFilters !== undefined ? hasActiveFilters : sortKey !== defaultSortKey || selectedOrder !== defaultSortOrder
  );

  function setSortKey(value: string) {
    sortKey = value;
    onSortKeyChange?.(value);
  }

  function setOrder(value: string) {
    if (value === 'asc' || value === 'desc') {
      selectedOrder = value;
      onOrderChange?.(value);
    }
  }
</script>

<Popover.Root bind:open={isOpen}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <div class="relative">
        <Button {...props} variant="outline" size="sm" aria-label={$t('courses.tag_filters.filter')}>
          {#if isFiltering}
            <Spinner class="size-4" />
          {:else}
            <FilterIcon size={16} />
          {/if}
          <span class="hidden md:inline">{$t('courses.tag_filters.filter')}</span>
        </Button>
        {#if isActive}
          <span
            class="ui:bg-primary absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white"
            aria-hidden="true"
          ></span>
        {/if}
      </div>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content align="end" class="w-[360px] p-3">
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-semibold">{title ?? $t('courses.tag_filters.popover_title')}</p>
        <Button variant="link" class="h-auto p-0" onclick={onClearFilters} disabled={!isActive}>
          {$t('courses.tag_filters.clear_all')}
        </Button>
      </div>

      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('courses.tag_filters.sort')}
        </p>
        <div class="flex flex-wrap gap-2">
          {#each sortOptions as option (option.value)}
            <Button
              type="button"
              size="sm"
              variant={sortKey === option.value ? 'secondary' : 'outline'}
              onclick={() => setSortKey(option.value)}
            >
              {option.label}
            </Button>
          {/each}
        </div>
      </div>

      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('courses.tag_filters.order')}
        </p>
        <ToggleGroup.Root type="single" variant="outline" size="sm" value={selectedOrder} onValueChange={setOrder}>
          <ToggleGroup.Item value="asc">{$t('courses.tag_filters.ascending')}</ToggleGroup.Item>
          <ToggleGroup.Item value="desc">{$t('courses.tag_filters.descending')}</ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>

      {@render additionalContent?.()}
    </div>
  </Popover.Content>
</Popover.Root>
