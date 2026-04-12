<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import * as ToggleGroup from '@cio/ui/base/toggle-group';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import { t } from '$lib/utils/functions/translations';
  import {
    DEFAULT_PROGRAM_SORT,
    DEFAULT_PROGRAM_SORT_ORDER,
    type ProgramSortBy,
    type ProgramSortOrder
  } from '../utils/constants';

  interface StatusOption {
    value: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    label: string;
  }

  interface SortOption {
    value: ProgramSortBy;
    label: string;
  }

  interface Props {
    sortKey?: ProgramSortBy;
    selectedOrder?: ProgramSortOrder;
    selectedStatuses?: string[];
    statusOptions?: StatusOption[];
    sortOptions?: SortOption[];
    onToggleStatus?: (status: string, checked: boolean) => void;
    onClearFilters?: () => void | Promise<void>;
  }

  let {
    sortKey = $bindable(DEFAULT_PROGRAM_SORT),
    selectedOrder = $bindable(DEFAULT_PROGRAM_SORT_ORDER),
    selectedStatuses = [],
    statusOptions = [],
    sortOptions = [],
    onToggleStatus = () => {},
    onClearFilters = () => {}
  }: Props = $props();

  let isOpen = $state(false);

  const hasActiveFilters = $derived(
    sortKey !== DEFAULT_PROGRAM_SORT || selectedOrder !== DEFAULT_PROGRAM_SORT_ORDER || selectedStatuses.length > 0
  );

  function isStatusSelected(status: string) {
    return selectedStatuses.includes(status);
  }
</script>

<Popover.Root bind:open={isOpen}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <div class="relative">
        <IconButton {...props} aria-label={$t('programs.filters.filter')} tooltip={$t('programs.filters.filter')}>
          <FilterIcon size={16} />
        </IconButton>
        {#if hasActiveFilters}
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
        <p class="text-sm font-semibold">{$t('programs.filters.popover_title')}</p>
        <Button variant="link" class="h-auto p-0" onclick={onClearFilters} disabled={!hasActiveFilters}>
          {$t('programs.filters.clear_all')}
        </Button>
      </div>

      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('programs.filters.sort')}
        </p>
        <div class="flex flex-wrap gap-2">
          {#each sortOptions as option (option.value)}
            <Button
              type="button"
              size="sm"
              variant={sortKey === option.value ? 'secondary' : 'outline'}
              onclick={() => (sortKey = option.value)}
            >
              {option.label}
            </Button>
          {/each}
        </div>
      </div>

      <div class="space-y-2">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('programs.filters.order')}
        </p>
        <ToggleGroup.Root
          type="single"
          variant="outline"
          size="sm"
          value={selectedOrder}
          onValueChange={(value) => {
            if (value === 'asc' || value === 'desc') {
              selectedOrder = value;
            }
          }}
        >
          <ToggleGroup.Item value="asc">{$t('programs.filters.ascending')}</ToggleGroup.Item>
          <ToggleGroup.Item value="desc">{$t('programs.filters.descending')}</ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>

      <div class="space-y-3">
        <p class="ui:text-muted-foreground text-xs font-semibold uppercase">
          {$t('programs.filters.status')}
        </p>
        <div class="space-y-2">
          {#each statusOptions as option (option.value)}
            <label class="hover:ui:bg-muted/30 flex cursor-pointer items-center rounded-md border px-3 py-2">
              <div class="flex items-center gap-2">
                <Checkbox
                  checked={isStatusSelected(option.value)}
                  onCheckedChange={(checked) => onToggleStatus(option.value, Boolean(checked))}
                />
                <span class="text-sm">{option.label}</span>
              </div>
            </label>
          {/each}
        </div>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
