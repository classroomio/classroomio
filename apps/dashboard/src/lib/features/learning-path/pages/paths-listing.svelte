<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import * as Page from '@cio/ui/base/page';
  import * as Item from '@cio/ui/base/item';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import { Empty } from '@cio/ui/custom/empty';
  import { Search } from '@cio/ui/custom/search';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { DeleteModal } from '$features/ui';
  import { snackbar } from '$features/ui/snackbar/store';
  import GitBranchIcon from '@lucide/svelte/icons/git-branch';
  import GridIcon from '@lucide/svelte/icons/grid-2x2';
  import ListIcon from '@lucide/svelte/icons/list';
  import { Button } from '@cio/ui/base/button';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import { PathCard, PathRow, PathFilterPopover, CreatePathModal } from '../components';
  import { learningPathApi } from '../api';
  import {
    LEARNING_PATHS_VIEW_MODE_KEY,
    DEFAULT_VIEW_MODE,
    DEFAULT_PATH_SORT,
    DEFAULT_SORT_ORDER
  } from '../utils/constants';
  import {
    hasActivePathListFilters,
    mergePathListSearchParams,
    parsePathListFilters
  } from '../utils/path-list-filters';
  import type { CompletionFilter, EnrollmentFilter, PathListFilters, StatusFilter, ViewMode } from '../utils/types';
  import type { PathSortBy, PathSortOrder } from '../utils/constants';

  let { loadError = null }: { loadError?: string | null } = $props();

  /** URL is the source of truth; controls read from here. */
  const filters = $derived(parsePathListFilters(page.url.searchParams));
  const filtersActive = $derived(hasActivePathListFilters(filters));

  let searchInput = $state(filters.search);
  let searchDebounce: ReturnType<typeof setTimeout> | null = null;
  let viewMode = $state<ViewMode>(DEFAULT_VIEW_MODE);
  let showCreateDialog = $state(false);

  // Deletion modal state
  let deleteModalOpen = $state(false);
  let isDeleting = $state(false);
  let pathToDelete = $state<{ id: string; name: string } | null>(null);

  // Keep the search box in sync when the URL changes elsewhere (back button, clear).
  // Untracked read of searchInput so typing doesn't re-trigger and clobber itself.
  $effect(() => {
    const urlSearch = filters.search;
    untrack(() => {
      if (searchDebounce) return;
      if (urlSearch !== searchInput) {
        searchInput = urlSearch;
      }
    });
  });

  // Query parameter support (?create=true)
  $effect(() => {
    const isCreateRequested = page.url.searchParams.get('create') === 'true';
    if (isCreateRequested && $isOrgAdmin) {
      showCreateDialog = true;
    }
  });

  onMount(() => {
    const savedView = localStorage.getItem(LEARNING_PATHS_VIEW_MODE_KEY) as ViewMode | null;
    if (savedView === 'grid' || savedView === 'list') {
      viewMode = savedView;
    }
  });

  onDestroy(() => {
    if (searchDebounce) clearTimeout(searchDebounce);
  });

  /**
   * Navigates to page 1 with new filters, preserving unrelated params.
   * The server `load` re-runs for page 1.
   */
  function navigateWithFilters(next: PathListFilters) {
    if (!browser) return;

    const merged = mergePathListSearchParams(page.url.searchParams, next);
    const query = merged.toString();
    goto(`${page.url.pathname}${query ? `?${query}` : ''}`, {
      replaceState: true,
      keepFocus: true,
      noScroll: true
    });
  }

  function handleSearchInput(value: string) {
    searchInput = value;

    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchDebounce = null;
      navigateWithFilters({ ...filters, search: searchInput });
    }, 300);
  }

  function handleSortChange(sort: PathSortBy, order: PathSortOrder) {
    navigateWithFilters({ ...filters, sort, order });
  }

  function handleOrderChange(order: PathSortOrder) {
    navigateWithFilters({ ...filters, order });
  }

  function handleStatusChange(status: StatusFilter) {
    navigateWithFilters({ ...filters, status });
  }

  function handleEnrollmentChange(enrollment: EnrollmentFilter) {
    navigateWithFilters({ ...filters, enrollment });
  }

  function handleCompletionChange(completion: CompletionFilter) {
    navigateWithFilters({ ...filters, completion });
  }

  function handleViewModeChange(newView: ViewMode) {
    viewMode = newView;
    if (browser) {
      localStorage.setItem(LEARNING_PATHS_VIEW_MODE_KEY, newView);
    }
  }

  function handleCloseCreateDialog() {
    showCreateDialog = false;
    if (browser && page.url.searchParams.has('create')) {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete('create');
      goto(nextUrl.pathname + (nextUrl.search ? nextUrl.search : ''), { replaceState: true, noScroll: true });
    }
  }

  function handleClearAllFilters() {
    if (searchDebounce) clearTimeout(searchDebounce);
    searchInput = '';
    navigateWithFilters({
      search: '',
      status: 'all',
      enrollment: 'all',
      completion: 'all',
      sort: DEFAULT_PATH_SORT,
      order: DEFAULT_SORT_ORDER
    });
  }

  function handleRequestDelete(id: string, name: string) {
    pathToDelete = { id, name };
    deleteModalOpen = true;
  }

  async function handleConfirmDelete() {
    if (!pathToDelete) return;

    isDeleting = true;
    try {
      await learningPathApi.delete(pathToDelete.id);
    } catch (err) {
      console.error('Failed to delete learning path:', err);
      snackbar.error();
    } finally {
      deleteModalOpen = false;
      pathToDelete = null;
      isDeleting = false;
    }
  }

  async function handleLoadMore() {
    await learningPathApi.loadMorePaths($currentOrg.id, filters);
  }

  function handleCreated(newId: string) {
    goto(`/paths/${newId}/setup`);
  }
</script>

<DeleteModal bind:open={deleteModalOpen} onDelete={handleConfirmDelete} isLoading={isDeleting} />

<CreatePathModal bind:open={showCreateDialog} onClose={handleCloseCreateDialog} onCreated={handleCreated} />

<!-- Toolbar matching Courses Page.BodyHeader -->
<Page.BodyHeader align="right" class="p-0!">
  <Search
    placeholder={$t('learningPath.listing.toolbar.search_placeholder')}
    bind:value={searchInput}
    onValueChange={handleSearchInput}
  />

  <PathFilterPopover
    sortKey={filters.sort}
    selectedOrder={filters.order}
    statusFilter={filters.status}
    enrollmentFilter={filters.enrollment}
    completionFilter={filters.completion}
    onStatusChange={handleStatusChange}
    onEnrollmentChange={handleEnrollmentChange}
    onCompletionChange={handleCompletionChange}
    onSortChange={handleSortChange}
    onOrderChange={handleOrderChange}
    onClearFilters={handleClearAllFilters}
  />

  {#if viewMode === 'list'}
    <IconButton onclick={() => handleViewModeChange('grid')} aria-label={$t('learningPath.listing.toolbar.grid_view')}>
      <GridIcon size={16} />
    </IconButton>
  {:else}
    <IconButton onclick={() => handleViewModeChange('list')} aria-label={$t('learningPath.listing.toolbar.list_view')}>
      <ListIcon size={16} />
    </IconButton>
  {/if}
</Page.BodyHeader>

<!-- Content Area -->
<div class="mx-auto mt-4 w-full flex-1">
  {#if !loadError && learningPathApi.paths.length === 0 && !filtersActive}
    <Empty
      title={$t('learningPath.listing.empty.title')}
      description={$t('learningPath.listing.empty.description')}
      icon={GitBranchIcon}
      variant="page"
    />
  {:else if learningPathApi.paths.length === 0}
    <Empty
      title={$t('learningPath.listing.empty.no_matches_title')}
      description={$t('learningPath.listing.empty.no_matches_description')}
      icon={GitBranchIcon}
      variant="page"
    >
      <Button variant="outline" onclick={handleClearAllFilters}>
        {$t('learningPath.listing.filters.clear_all')}
      </Button>
    </Empty>
  {:else if viewMode === 'grid'}
    <Item.Group class="grid! w-full grid-cols-1 justify-items-center gap-4 md:grid-cols-2 xl:grid-cols-3">
      {#each learningPathApi.paths as path (path.id)}
        <PathCard {path} onDelete={handleRequestDelete} />
      {/each}
    </Item.Group>
  {:else}
    <ResourceListRow.Group class="@container">
      {#each learningPathApi.paths as path (path.id)}
        <PathRow {path} onDelete={handleRequestDelete} />
      {/each}
    </ResourceListRow.Group>
  {/if}

  {#if learningPathApi.hasMorePaths && learningPathApi.paths.length > 0}
    <div class="mt-6 flex justify-center">
      <Button
        variant="outline"
        testId="paths-listing-load-more"
        loading={learningPathApi.isLoadingMorePaths}
        onclick={handleLoadMore}
      >
        {$t('learningPath.listing.load_more')}
      </Button>
    </div>
  {/if}
</div>
