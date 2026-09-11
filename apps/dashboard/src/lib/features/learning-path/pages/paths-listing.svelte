<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import SearchIcon from '@lucide/svelte/icons/search';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { t } from '$lib/utils/functions/translations';
  import {
    MetricCards,
    PathCard,
    PathRow,
    PathFilterPopover,
    ViewToggle,
    PathEmptyState,
    CreatePathDialog
  } from '../components';
  import { learningPathApi } from '../api';
  import { LEARNING_PATHS_VIEW_MODE_KEY, DEFAULT_VIEW_MODE } from '../utils/constants';
  import type { StatusFilter, EnrollmentFilter, CompletionFilter, ViewMode, LearningPathSummary } from '../utils/types';

  interface Props {
    basePath: string;
    orgSlug: string;
  }

  let { basePath, orgSlug }: Props = $props();

  let searchQuery = $state('');
  let statusFilter = $state<StatusFilter>('all');
  let enrollmentFilter = $state<EnrollmentFilter>('all');
  let completionFilter = $state<CompletionFilter>('all');
  let viewMode = $state<ViewMode>(DEFAULT_VIEW_MODE);
  let showCreateDialog = $state(false);
  let previewEmpty = $state(false);

  onMount(() => {
    const savedView = localStorage.getItem(LEARNING_PATHS_VIEW_MODE_KEY) as ViewMode | null;
    if (savedView === 'grid' || savedView === 'list') {
      viewMode = savedView;
    }
  });

  function handleViewModeChange(newView: ViewMode) {
    viewMode = newView;
    localStorage.setItem(LEARNING_PATHS_VIEW_MODE_KEY, newView);
  }

  function handleClearAllFilters() {
    statusFilter = 'all';
    enrollmentFilter = 'all';
    completionFilter = 'all';
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
    if (statusFilter === 'draft') {
      list = list.filter((p) => p.status === 'DRAFT');
    } else if (statusFilter === 'published') {
      list = list.filter((p) => p.status === 'ACTIVE');
    } else if (statusFilter === 'archived') {
      list = list.filter((p) => p.status === 'ARCHIVED');
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

    return list;
  });

  function handleCreated(newId: string) {
    goto(`${basePath}/${newId}/setup`);
  }

  function handleCreateCourse() {
    goto(`/org/${orgSlug}/courses`);
  }
</script>

<Page.Root class="w-full max-w-5xl">
  <Page.Header class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <Page.Title class="text-foreground text-2xl font-bold tracking-tight">
        {$t('learningPath.listing.title')}
      </Page.Title>
      <Page.Subtitle class="text-muted-foreground mt-1 text-sm">
        {$t('learningPath.listing.subtitle')}
      </Page.Subtitle>
    </div>

    <div class="flex shrink-0 items-center gap-2.5">
      <Button variant="outline" onclick={handleCreateCourse}>
        <PlusIcon class="mr-1.5 size-4" />
        {$t('learningPath.listing.create_course')}
      </Button>

      <Button variant="primary" onclick={() => (showCreateDialog = true)}>
        <PlusIcon class="mr-1.5 size-4" />
        {$t('learningPath.listing.create_path')}
      </Button>
    </div>
  </Page.Header>

  <Page.Body>
    <!-- Performance Overview -->
    <MetricCards metrics={learningPathApi.metrics} />

    <!-- Toolbar -->
    <div class="mb-5 flex flex-wrap items-center gap-2.5">
      <div class="relative max-w-[320px] min-w-[200px] flex-1">
        <SearchIcon class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          bind:value={searchQuery}
          placeholder={$t('learningPath.listing.toolbar.search_placeholder')}
          class="bg-card h-9 pl-9"
        />
      </div>

      <PathFilterPopover
        status={statusFilter}
        enrollment={enrollmentFilter}
        completion={completionFilter}
        onStatusChange={(val) => (statusFilter = val)}
        onEnrollmentChange={(val) => (enrollmentFilter = val)}
        onCompletionChange={(val) => (completionFilter = val)}
        onClearAll={handleClearAllFilters}
      />

      <span class="flex-1"></span>

      <ViewToggle view={viewMode} onViewChange={handleViewModeChange} />

      <Button variant="outline" size="sm" onclick={() => (previewEmpty = !previewEmpty)} class="text-xs">
        {previewEmpty
          ? $t('learningPath.listing.toolbar.exit_preview_empty')
          : $t('learningPath.listing.toolbar.preview_empty')}
      </Button>
    </div>

    <!-- Content Area -->
    {#if previewEmpty || learningPathApi.paths.length === 0}
      <PathEmptyState onCreatePath={() => (showCreateDialog = true)} onCreateCourse={handleCreateCourse} />
    {:else if filteredPaths.length === 0}
      <div class="border-border bg-card rounded-xl border border-dashed p-12 text-center">
        <p class="text-muted-foreground text-sm">No learning paths match your active filters.</p>
        <Button variant="outline" size="sm" class="mt-3 text-xs" onclick={handleClearAllFilters}>
          {$t('learningPath.listing.filters.clear_all')}
        </Button>
      </div>
    {:else if viewMode === 'grid'}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {#each filteredPaths as path (path.id)}
          <PathCard {path} {basePath} />
        {/each}
      </div>
    {:else}
      <div class="space-y-3">
        {#each filteredPaths as path (path.id)}
          <PathRow {path} {basePath} />
        {/each}
      </div>
    {/if}
  </Page.Body>
</Page.Root>

<CreatePathDialog bind:open={showCreateDialog} onClose={() => (showCreateDialog = false)} onCreated={handleCreated} />
