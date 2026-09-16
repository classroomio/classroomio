<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as Page from '@cio/ui/base/page';
  import * as Item from '@cio/ui/base/item';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import { Empty } from '@cio/ui/custom/empty';
  import { Search } from '@cio/ui/custom/search';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { DeleteModal } from '$features/ui';
  import GitBranchIcon from '@lucide/svelte/icons/git-branch';
  import GridIcon from '@lucide/svelte/icons/grid-2x2';
  import ListIcon from '@lucide/svelte/icons/list';
  import { Button } from '@cio/ui/base/button';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { t } from '$lib/utils/functions/translations';
  import { PathCard, PathRow, PathFilterPopover, CreatePathModal, ClonePathModal } from '../components';
  import { learningPathApi } from '../api';
  import {
    LEARNING_PATHS_VIEW_MODE_KEY,
    DEFAULT_VIEW_MODE,
    DEFAULT_PATH_SORT,
    DEFAULT_SORT_ORDER,
    type PathSortBy,
    type PathSortOrder
  } from '../utils/constants';
  import type { StatusFilter, EnrollmentFilter, CompletionFilter, ViewMode, LearningPathDetail } from '../utils/types';

  interface Props {
    initialPaths?: LearningPathDetail[];
  }

  let { initialPaths }: Props = $props();

  $effect.pre(() => {
    if (initialPaths && initialPaths.length > 0 && learningPathApi.paths.length === 0) {
      learningPathApi.setPaths(initialPaths);
    }
  });

  let searchQuery = $state('');
  let sortKey = $state<PathSortBy>(DEFAULT_PATH_SORT);
  let selectedOrder = $state<PathSortOrder>(DEFAULT_SORT_ORDER);
  let statusFilter = $state<StatusFilter>('all');
  let enrollmentFilter = $state<EnrollmentFilter>('all');
  let completionFilter = $state<CompletionFilter>('all');
  let viewMode = $state<ViewMode>(DEFAULT_VIEW_MODE);
  let showCreateDialog = $state(false);

  // Deletion modal state
  let deleteModalOpen = $state(false);
  let isDeleting = $state(false);
  let pathToDelete = $state<{ id: string; name: string } | null>(null);

  // Query parameter support (?create=true)
  $effect(() => {
    const isCreateRequested = page.url.searchParams.get('create') === 'true';
    if (isCreateRequested) {
      showCreateDialog = true;
    }
  });

  onMount(() => {
    const savedView = localStorage.getItem(LEARNING_PATHS_VIEW_MODE_KEY) as ViewMode | null;
    if (savedView === 'grid' || savedView === 'list') {
      viewMode = savedView;
    }
  });

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
    sortKey = DEFAULT_PATH_SORT;
    selectedOrder = DEFAULT_SORT_ORDER;
    statusFilter = 'all';
    enrollmentFilter = 'all';
    completionFilter = 'all';
    searchQuery = '';
  }

  function handleRequestDelete(id: string, name: string) {
    pathToDelete = { id, name };
    deleteModalOpen = true;
  }

  async function handleConfirmDelete() {
    if (!pathToDelete) return;

    isDeleting = true;
    try {
      await learningPathApi.deletePath(pathToDelete.id);
      deleteModalOpen = false;
      pathToDelete = null;
    } finally {
      isDeleting = false;
    }
  }

  const filteredPaths = $derived.by(() => {
    let list = learningPathApi.paths;

    // Search filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter === 'published') {
      list = list.filter((p) => p.isPublished);
    } else if (statusFilter === 'unpublished') {
      list = list.filter((p) => !p.isPublished);
    }

    // Enrollment filter
    if (enrollmentFilter === 'none') {
      list = list.filter((p) => (p.memberCount || 0) === 0);
    } else if (enrollmentFilter === '1-49') {
      list = list.filter((p) => (p.memberCount || 0) >= 1 && (p.memberCount || 0) <= 49);
    } else if (enrollmentFilter === '50+') {
      list = list.filter((p) => (p.memberCount || 0) >= 50);
    }

    // Completion rate filter
    if (completionFilter === 'low') {
      list = list.filter((p) => (p.completionRate || 0) < 25);
    } else if (completionFilter === 'medium') {
      list = list.filter((p) => (p.completionRate || 0) >= 25 && (p.completionRate || 0) <= 75);
    } else if (completionFilter === 'high') {
      list = list.filter((p) => (p.completionRate || 0) > 75);
    }

    // Sorting
    const sorted = [...list];
    sorted.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'date_created') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === 'last_updated_at') {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortKey === 'published') {
        const aPub = a.isPublished ? 1 : 0;
        const bPub = b.isPublished ? 1 : 0;
        comparison = aPub - bPub;
      } else if (sortKey === 'courses') {
        comparison = (a.courseCount || 0) - (b.courseCount || 0);
      }
      return selectedOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  });

  function handleCreated(newId: string) {
    goto(`/paths/${newId}/courses`);
  }
</script>

<DeleteModal bind:open={deleteModalOpen} onDelete={handleConfirmDelete} isLoading={isDeleting} />

<CreatePathModal bind:open={showCreateDialog} onClose={handleCloseCreateDialog} onCreated={handleCreated} />

<ClonePathModal />

<!-- Toolbar matching Courses Page.BodyHeader -->
<Page.BodyHeader align="right" class="p-0!">
  <Search placeholder={$t('learningPath.listing.toolbar.search_placeholder')} bind:value={searchQuery} />

  <PathFilterPopover
    bind:sortKey
    bind:selectedOrder
    bind:statusFilter
    bind:enrollmentFilter
    bind:completionFilter
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
  {#if learningPathApi.paths.length === 0}
    <Empty
      title={$t('learningPath.listing.empty.title')}
      description={$t('learningPath.listing.empty.description')}
      icon={GitBranchIcon}
      variant="page"
    />
  {:else if filteredPaths.length === 0}
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
      {#each filteredPaths as path (path.id)}
        <PathCard {path} onDelete={handleRequestDelete} />
      {/each}
    </Item.Group>
  {:else}
    <ResourceListRow.Group class="@container">
      {#each filteredPaths as path (path.id)}
        <PathRow {path} onDelete={handleRequestDelete} />
      {/each}
    </ResourceListRow.Group>
  {/if}
</div>
