<script lang="ts">
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
    searchValue?: string;
    query: OrganizationAudienceQuery;
    activeView: OrganizationAudienceView | null;
    activeFilterCount: number;
    totalCount: number;
    onSortChange: (sortBy: OrganizationAudienceSortBy, sortOrder: OrganizationAudienceSortOrder) => void;
    onFilterChange: (patch: Partial<OrganizationAudienceQuery>) => void;
    onClearFilters: () => void;
    onSelectView: (view: OrganizationAudienceView) => void;
  }

  let {
    searchValue = $bindable(''),
    query,
    activeView,
    activeFilterCount,
    totalCount,
    onSortChange,
    onFilterChange,
    onClearFilters,
    onSelectView
  }: Props = $props();
</script>

<Page.BodyHeader>
  <div class="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-end">
    <!-- The student count lives here as muted subtitle text rather than as a
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
</Page.BodyHeader>
