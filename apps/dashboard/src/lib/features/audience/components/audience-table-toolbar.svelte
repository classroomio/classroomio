<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Search } from '@cio/ui/custom/search';
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import AudienceFilterPopover from './audience-filter-popover.svelte';
  import AudienceViewSwitcher from './audience-view-switcher.svelte';
  import type {
    OrganizationAudienceQuery,
    OrganizationAudienceSortBy,
    OrganizationAudienceSortOrder,
    OrganizationAudienceView
  } from '$features/org/utils/types';

  interface Props {
    hasSelection: boolean;
    selectedCount: number;
    searchValue?: string;
    query: OrganizationAudienceQuery;
    activeView: OrganizationAudienceView | null;
    activeFilterCount: number;
    totalCount: number;
    onSortChange: (sortBy: OrganizationAudienceSortBy, sortOrder: OrganizationAudienceSortOrder) => void;
    onFilterChange: (patch: Partial<OrganizationAudienceQuery>) => void;
    onClearFilters: () => void;
    onSelectView: (view: OrganizationAudienceView) => void;
    onOpenAssign: () => void;
  }

  let {
    hasSelection,
    selectedCount,
    searchValue = $bindable(''),
    query,
    activeView,
    activeFilterCount,
    totalCount,
    onSortChange,
    onFilterChange,
    onClearFilters,
    onSelectView,
    onOpenAssign
  }: Props = $props();
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
    <div class="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-end">
      <!-- The learner count lives here as muted subtitle text rather than as a
           row of coloured chips, so the page stays quiet. -->
      <p class="ui:text-muted-foreground mr-auto text-sm">
        {$t('audience.learner_count', { count: totalCount })}
      </p>
      <AudienceViewSwitcher {activeView} {onSelectView} />
      <Search placeholder={$t('audience.search_placeholder')} bind:value={searchValue} class="w-full md:max-w-xs" />
      <AudienceFilterPopover
        {query}
        sortBy={query.sortBy}
        sortOrder={query.sortOrder}
        {activeFilterCount}
        {onFilterChange}
        {onClearFilters}
        {onSortChange}
      />
    </div>
  {/if}
</Page.BodyHeader>
