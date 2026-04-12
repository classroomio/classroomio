<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Search } from '@cio/ui/custom/search';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { SortPopover } from '$features/ui';
  import type { OrganizationAudienceSortBy, OrganizationAudienceSortOrder } from '$features/org/utils/types';

  interface Props {
    hasSelection: boolean;
    selectedCount: number;
    searchValue?: string;
    sortBy: OrganizationAudienceSortBy;
    sortOrder: OrganizationAudienceSortOrder;
    onSortChange: (sortBy: OrganizationAudienceSortBy, sortOrder: OrganizationAudienceSortOrder) => void;
    onOpenAssign: () => void;
  }

  let {
    hasSelection,
    selectedCount,
    searchValue = $bindable(''),
    sortBy,
    sortOrder,
    onSortChange,
    onOpenAssign
  }: Props = $props();

  const sortOptions = [
    { label: t.get('audience.date_joined'), value: 'createdAt' },
    { label: t.get('audience.name'), value: 'name' },
    { label: t.get('audience.email'), value: 'email' }
  ];

  let localSortKey = $state(sortBy);
  let localSortOrder = $state(sortOrder);

  $effect(() => {
    localSortKey = sortBy;
    localSortOrder = sortOrder;
  });

  function handleSortKeyChange(key: string) {
    onSortChange(key as OrganizationAudienceSortBy, localSortOrder);
  }

  function handleOrderChange(order: 'asc' | 'desc') {
    onSortChange(localSortKey, order);
  }

  function handleClearSort() {
    onSortChange('createdAt', 'desc');
  }
</script>

<Page.BodyHeader>
  {#if hasSelection}
    <div class="flex items-center gap-3 rounded-md border px-4 py-2">
      <span class="ui:text-muted-foreground text-sm">
        {$t('audience.selected_count', { count: selectedCount })}
      </span>
      <Button variant="secondary" size="sm" onclick={onOpenAssign}>
        {$t('audience.assign_courses')}
      </Button>
    </div>
  {:else}
    <div class="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <Search placeholder={$t('audience.search_placeholder')} bind:value={searchValue} class="w-full md:max-w-sm" />
      <SortPopover
        {sortOptions}
        bind:sortKey={localSortKey}
        bind:selectedOrder={localSortOrder}
        defaultSortKey="createdAt"
        defaultSortOrder="desc"
        onSortKeyChange={handleSortKeyChange}
        onOrderChange={handleOrderChange}
        onClearFilters={handleClearSort}
      />
    </div>
  {/if}
</Page.BodyHeader>
