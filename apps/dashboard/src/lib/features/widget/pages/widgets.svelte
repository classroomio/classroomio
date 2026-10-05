<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import type { ArchivedWidgetListPagination, WidgetListItem, WidgetListPagination } from '../utils/types';
  import {
    clearWidgetListFilters,
    countActiveWidgetFilters,
    DEFAULT_WIDGET_LIST_FILTERS,
    getWidgetListFiltersFromSearchParams,
    mergeWidgetListSearchParams,
    withFilterChange,
    withoutStatusFilter,
    type WidgetListFilters
  } from '../utils/widget-list-filters';
  import type { TWidgetLayoutType, TWidgetListStatus, TWidgetSelectionMode } from '@cio/utils/validation/widget';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { Search } from '@cio/ui/custom/search';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import ArchiveIcon from '@lucide/svelte/icons/archive';
  import PanelsTopLeftIcon from '@lucide/svelte/icons/panels-top-left';
  import WidgetList from '../components/widget-list.svelte';
  import WidgetFilterPopover from '../components/widget-filter-popover.svelte';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    initialWidgets?: WidgetListItem[];
    initialArchivedWidgets?: WidgetListItem[];
    widgetPagination?: WidgetListPagination;
    archivedWidgetPagination?: ArchivedWidgetListPagination;
    onCreate: () => void | Promise<void>;
  }

  const SEARCH_DEBOUNCE_MS = 300;
  const EMPTY_PAGINATION: WidgetListPagination = { page: 1, limit: 20, total: 0, totalPages: 0 };

  let {
    initialWidgets = [],
    initialArchivedWidgets = [],
    widgetPagination = EMPTY_PAGINATION,
    archivedWidgetPagination = EMPTY_PAGINATION,
    onCreate
  }: Props = $props();

  let currentTab = $state<'active' | 'archived'>('active');
  let searchValue = $state('');

  const filters = $derived(getWidgetListFiltersFromSearchParams(page.url.searchParams));
  const tabFilters = $derived(currentTab === 'archived' ? withoutStatusFilter(filters) : filters);
  const activeFilterCount = $derived(countActiveWidgetFilters(tabFilters));
  const isFiltering = $derived(activeFilterCount > 0);

  $effect(() => {
    searchValue = filters.search;
  });

  $effect(() => {
    const normalizedSearch = searchValue.trim();
    if (normalizedSearch === filters.search) return;

    const timeoutId = setTimeout(() => {
      void navigateFilters(withFilterChange(filters, { search: normalizedSearch }), { replaceState: true });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  });

  async function navigateFilters(nextFilters: WidgetListFilters, options: { replaceState?: boolean } = {}) {
    const params = mergeWidgetListSearchParams(page.url.searchParams, nextFilters);
    const nextSearch = params.toString();

    if (nextSearch === page.url.searchParams.toString()) return;

    const target = `${page.url.pathname}${nextSearch ? `?${nextSearch}` : ''}${page.url.hash}`;
    await goto(target, {
      replaceState: options.replaceState ?? false,
      keepFocus: true,
      noScroll: true,
      invalidateAll: true
    });
  }

  function handlePageChange(nextPage: number) {
    if (nextPage === filters.page) return;

    void navigateFilters({ ...filters, page: nextPage });
  }

  function handleStatusesChange(statuses: TWidgetListStatus[]) {
    void navigateFilters(withFilterChange(filters, { statuses }));
  }

  function handleLayoutTypesChange(layoutTypes: TWidgetLayoutType[]) {
    void navigateFilters(withFilterChange(filters, { layoutTypes }));
  }

  function handleSelectionModesChange(selectionModes: TWidgetSelectionMode[]) {
    void navigateFilters(withFilterChange(filters, { selectionModes }));
  }

  function handleClearFilters(resetPage = false) {
    searchValue = '';
    const clearedFilters = clearWidgetListFilters(filters);
    void navigateFilters(resetPage ? { ...clearedFilters, page: 1 } : clearedFilters);
  }

  function handleTabChange() {
    if (filters.page === DEFAULT_WIDGET_LIST_FILTERS.page) return;

    void navigateFilters({ ...filters, page: DEFAULT_WIDGET_LIST_FILTERS.page });
  }

  const tabs = $derived([
    { value: 'active' as const, label: `${$t('widgets.tabs.active')} (${widgetPagination.total})` },
    {
      value: 'archived' as const,
      label: `${$t('widgets.tabs.archived')} (${archivedWidgetPagination.total})`
    }
  ]);
</script>

<Page.BodyHeader align="right" class="p-2!">
  <Search placeholder={$t('widgets.filters.search_placeholder')} bind:value={searchValue} />
  <WidgetFilterPopover
    mode={currentTab}
    statuses={filters.statuses}
    layoutTypes={filters.layoutTypes}
    selectionModes={filters.selectionModes}
    {activeFilterCount}
    onStatusesChange={handleStatusesChange}
    onLayoutTypesChange={handleLayoutTypesChange}
    onSelectionModesChange={handleSelectionModesChange}
    onClearFilters={() => handleClearFilters()}
  />
</Page.BodyHeader>

<UnderlineTabs.Root bind:value={currentTab} onValueChange={handleTabChange}>
  <UnderlineTabs.List class="mb-6">
    {#each tabs as tab (tab.value)}
      <UnderlineTabs.Trigger value={tab.value}>
        {tab.label}
      </UnderlineTabs.Trigger>
    {/each}
  </UnderlineTabs.List>

  <UnderlineTabs.Content value="active">
    <WidgetList
      widgets={initialWidgets}
      mode="active"
      pagination={widgetPagination}
      {isFiltering}
      emptyTitle={$t('widgets.empty.heading')}
      emptyDescription={$t('widgets.empty.description')}
      emptyIcon={PanelsTopLeftIcon}
      onClearFilters={() => handleClearFilters(true)}
      onPageChange={handlePageChange}
    >
      {#snippet emptyAction()}
        <Button onclick={onCreate}>{$t('widgets.actions.create')}</Button>
      {/snippet}
    </WidgetList>
  </UnderlineTabs.Content>

  <UnderlineTabs.Content value="archived">
    <WidgetList
      widgets={initialArchivedWidgets}
      mode="archived"
      pagination={archivedWidgetPagination}
      {isFiltering}
      emptyTitle={$t('widgets.archived.empty')}
      emptyDescription={$t('widgets.archived.empty_description')}
      emptyIcon={ArchiveIcon}
      onClearFilters={() => handleClearFilters(true)}
      onPageChange={handlePageChange}
    />
  </UnderlineTabs.Content>
</UnderlineTabs.Root>
