<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { MultiSelectList } from '@cio/ui/custom/multi-select-list';
  import { t } from '$lib/utils/functions/translations';
  import { pathCoursesApi } from '../api';
  import { coursesApi } from '$features/course/api';
  import { onDestroy, untrack } from 'svelte';

  interface Props {
    open: boolean;
    pathId: string;
    existingCourseIds: string[];
    onClose: () => void;
  }

  const COURSE_PAGE_SIZE = 20;

  let { open = $bindable(false), pathId, existingCourseIds = [], onClose }: Props = $props();

  let searchValue = $state('');
  let currentPage = $state(1);
  const selectedCourseIds = new SvelteSet<string>();
  const showLoadingState = $derived(coursesApi.isLoading);

  const existingSet = $derived(new Set(existingCourseIds));

  const availableCourses = $derived(coursesApi.orgCourses.filter((course) => !existingSet.has(course.id)));

  const filteredCourses = $derived.by(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return availableCourses;

    return availableCourses.filter((course) =>
      [course.title, course.description].some((val) => val?.toLowerCase().includes(query))
    );
  });

  const totalPages = $derived(Math.max(1, Math.ceil(filteredCourses.length / COURSE_PAGE_SIZE)));
  const paginatedCourses = $derived(
    filteredCourses.slice((currentPage - 1) * COURSE_PAGE_SIZE, currentPage * COURSE_PAGE_SIZE)
  );

  const selectedCount = $derived(selectedCourseIds.size);
  const canGoToPreviousPage = $derived(currentPage > 1);
  const canGoToNextPage = $derived(currentPage < totalPages);

  const multiSelectItems = $derived(
    paginatedCourses.map((c) => ({
      id: c.id,
      label: c.title,
      description: c.description
    }))
  );

  async function ensureCoursesLoaded() {
    if (coursesApi.orgCourses.length > 0) {
      return;
    }

    try {
      await coursesApi.getOrgCourses();
    } catch (error) {
      console.error('Failed to load courses for path modal', error);
    }
  }

  function toggleCourse(courseId: string) {
    if (selectedCourseIds.has(courseId)) {
      selectedCourseIds.delete(courseId);
    } else {
      selectedCourseIds.add(courseId);
    }
  }

  function goToPage(page: number) {
    currentPage = page;
  }

  function closeModal() {
    selectedCourseIds.clear();
    searchValue = '';
    currentPage = 1;
    open = false;
    onClose();
  }

  async function handleAdd() {
    const courseIds = [...selectedCourseIds];
    if (courseIds.length === 0) {
      return;
    }

    const didAddCourses = await pathCoursesApi.addCourses(pathId, courseIds);
    if (!didAddCourses) {
      return;
    }

    closeModal();
  }

  $effect(() => {
    if (!open) {
      return;
    }

    untrack(() => {
      selectedCourseIds.clear();
      searchValue = '';
      currentPage = 1;

      void ensureCoursesLoaded();
    });
  });

  onDestroy(() => {
    coursesApi.cancelOrgCoursesRequest();
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="flex max-h-[85vh] max-w-md flex-col overflow-hidden">
    <Dialog.Header class="shrink-0">
      <Dialog.Title class="ui:text-foreground text-lg font-semibold">
        {$t('learningPath.modals.add_courses.title')}
      </Dialog.Title>
    </Dialog.Header>

    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-2">
      <MultiSelectList
        class="border-0"
        listClass="max-h-60"
        items={multiSelectItems}
        isLoading={showLoadingState}
        isSelected={(id) => selectedCourseIds.has(id)}
        onToggle={toggleCourse}
        namePrefix="path-course"
        emptyMessage={searchValue.trim()
          ? $t('learningPath.modals.add_courses.no_matches')
          : $t('learningPath.modals.add_courses.no_courses')}
        searchPlaceholder={$t('learningPath.modals.add_courses.search_placeholder')}
        bind:searchValue
        onSearchValueChange={() => (currentPage = 1)}
      >
        {#snippet headingSnippet()}
          <p class="text-sm font-medium">
            {$t('learningPath.modals.add_courses.select_courses')}
            {#if selectedCount > 0}
              <span class="ui:text-muted-foreground text-xs">
                {$t('audience.selected_count', { count: selectedCount })}
              </span>
            {/if}
          </p>
        {/snippet}
      </MultiSelectList>

      {#if totalPages > 1}
        <div class="flex items-center justify-between gap-2 pt-2 text-sm">
          <span class="ui:text-muted-foreground">
            {$t('learningPath.modals.add_courses.pagination_status', {
              page: currentPage,
              totalPages
            })}
          </span>

          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onclick={() => goToPage(currentPage - 1)}
              disabled={!canGoToPreviousPage || showLoadingState}
            >
              {$t('app.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onclick={() => goToPage(currentPage + 1)}
              disabled={!canGoToNextPage || showLoadingState}
            >
              {$t('app.next')}
            </Button>
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer class="shrink-0 pt-3">
      <Button variant="outline" onclick={closeModal} disabled={pathCoursesApi.isLoading}>
        {$t('learningPath.modals.add_courses.cancel')}
      </Button>
      <Button
        type="button"
        variant="default"
        disabled={selectedCount === 0 || pathCoursesApi.isLoading}
        loading={pathCoursesApi.isLoading}
        onclick={handleAdd}
      >
        {#if pathCoursesApi.isLoading}
          {$t('learningPath.modals.add_courses.submitting')}
        {:else if selectedCount > 0}
          {$t('learningPath.modals.add_courses.submit', { count: selectedCount })}
        {:else}
          {$t('learningPath.modals.add_courses.submit', { count: 1 })}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
