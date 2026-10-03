<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { SvelteSet } from 'svelte/reactivity';
  import { Button } from '@cio/ui/base/button';
  import { MultiSelectList } from '@cio/ui/custom/multi-select-list';
  import { t } from '$lib/utils/functions/translations';
  import { CoursePickerApi } from '../api/course-picker.svelte';
  import type { AddableCourses, CoursePickerSource } from '../utils/types';

  interface Props {
    source: CoursePickerSource;
    /** Owned by the modal so the footer can count and submit the selection. Survives page changes. */
    selectedCourseIds: SvelteSet<string>;
    namePrefix: string;
    selectCoursesLabel: string;
    searchPlaceholder: string;
    emptyMessage: string;
    noMatchesMessage: string;
    paginationStatus: (page: number, totalPages: number) => string;
    errorMessage: string;
    retryLabel: string;
  }

  const PAGE_SIZE = 20;
  const SEARCH_DEBOUNCE_MS = 300;

  let {
    source,
    selectedCourseIds,
    namePrefix,
    selectCoursesLabel,
    searchPlaceholder,
    emptyMessage,
    noMatchesMessage,
    paginationStatus,
    errorMessage,
    retryLabel
  }: Props = $props();

  const pickerApi = new CoursePickerApi();

  let courses = $state<AddableCourses>([]);
  let currentPage = $state(1);
  let totalPages = $state(1);
  let searchValue = $state('');
  let appliedSearch = $state('');
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  let activeRequest: AbortController | null = null;
  // Tracked here, not via pickerApi.isLoading: an aborted request's cleanup
  // would clear that flag while the newer request is still in flight.
  let isLoadingPage = $state(false);
  let hasError = $state(false);

  const selectedCount = $derived(selectedCourseIds.size);
  const canGoToPreviousPage = $derived(currentPage > 1);
  const canGoToNextPage = $derived(currentPage < totalPages);
  const multiSelectItems = $derived(
    courses.map((course) => ({
      id: course.id,
      label: course.title || course.id,
      description: course.description || undefined
    }))
  );

  async function loadPage(page: number) {
    activeRequest?.abort();
    const request = new AbortController();
    activeRequest = request;
    isLoadingPage = true;
    hasError = false;

    const result = await pickerApi.listAddableCourses(
      source,
      { page, limit: PAGE_SIZE, search: appliedSearch },
      request.signal
    );

    // A newer search or page change superseded this request.
    if (activeRequest !== request) {
      return;
    }

    activeRequest = null;
    isLoadingPage = false;

    if (!result) {
      courses = [];
      totalPages = 1;
      hasError = true;
      return;
    }

    courses = result.data;
    currentPage = result.pagination.page;
    totalPages = Math.max(1, result.pagination.totalPages);
  }

  function handleSearchValueChange(value: string) {
    searchValue = value;

    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(() => {
      searchTimer = null;
      appliedSearch = value.trim();
      void loadPage(1);
    }, SEARCH_DEBOUNCE_MS);
  }

  function toggleCourse(courseId: string) {
    if (selectedCourseIds.has(courseId)) {
      selectedCourseIds.delete(courseId);
      return;
    }

    selectedCourseIds.add(courseId);
  }

  onMount(() => {
    void loadPage(1);
  });

  onDestroy(() => {
    activeRequest?.abort();

    if (searchTimer) {
      clearTimeout(searchTimer);
    }
  });
</script>

<MultiSelectList
  class="border-0"
  listClass="max-h-60"
  emptyMessage={hasError ? errorMessage : appliedSearch ? noMatchesMessage : emptyMessage}
  items={multiSelectItems}
  isLoading={isLoadingPage}
  isSelected={(id) => selectedCourseIds.has(id)}
  onToggle={toggleCourse}
  {namePrefix}
  {searchPlaceholder}
  bind:searchValue
  onSearchValueChange={handleSearchValueChange}
>
  {#snippet headingSnippet()}
    <p class="text-sm font-medium">
      {selectCoursesLabel}
      {#if selectedCount > 0}
        <span class="ui:text-muted-foreground text-xs">
          {$t('audience.selected_count', { count: selectedCount })}
        </span>
      {/if}
    </p>
  {/snippet}
</MultiSelectList>

{#if hasError}
  <div class="flex items-center justify-end px-1">
    <Button variant="outline" size="sm" onclick={() => loadPage(currentPage)} disabled={isLoadingPage}>
      {retryLabel}
    </Button>
  </div>
{:else if totalPages > 1}
  <div class="flex items-center justify-between gap-2 text-sm">
    <span class="ui:text-muted-foreground">{paginationStatus(currentPage, totalPages)}</span>

    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onclick={() => loadPage(currentPage - 1)}
        disabled={!canGoToPreviousPage || isLoadingPage}
      >
        {$t('app.previous')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onclick={() => loadPage(currentPage + 1)}
        disabled={!canGoToNextPage || isLoadingPage}
      >
        {$t('app.next')}
      </Button>
    </div>
  </div>
{/if}
