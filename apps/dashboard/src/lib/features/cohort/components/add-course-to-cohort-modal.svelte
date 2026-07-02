<script lang="ts">
  import { onDestroy } from 'svelte';
  import { untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { MultiSelectList } from '@cio/ui/custom/multi-select-list';
  import { t } from '$lib/utils/functions/translations';
  import { cohortApi } from '../api';
  import { coursesApi } from '$features/course/api';

  interface Props {
    open: boolean;
    cohortId: string;
  }

  const COURSE_PAGE_SIZE = 20;

  let { open = $bindable(false), cohortId }: Props = $props();

  let searchValue = $state('');
  let currentPage = $state(1);
  const selectedCourseIds = new SvelteSet<string>();

  const availableCourses = $derived.by(() => {
    const existingCourseIds = new Set(cohortApi.courses.map((course) => course.courseId));

    return coursesApi.orgCourses.filter((course) => !existingCourseIds.has(course.id));
  });
  const filteredCourses = $derived.by(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return availableCourses;
    }

    return availableCourses.filter((course) =>
      [course.title, course.description].some((value) => value?.toLowerCase().includes(normalizedSearch))
    );
  });
  const totalPages = $derived(Math.max(1, Math.ceil(filteredCourses.length / COURSE_PAGE_SIZE)));
  const paginatedCourses = $derived(
    filteredCourses.slice((currentPage - 1) * COURSE_PAGE_SIZE, currentPage * COURSE_PAGE_SIZE)
  );
  const selectedCount = $derived(selectedCourseIds.size);
  const showLoadingState = $derived(coursesApi.isLoading);
  const canGoToPreviousPage = $derived(currentPage > 1);
  const canGoToNextPage = $derived(currentPage < totalPages);
  const emptyMessage = $derived(
    searchValue.trim()
      ? $t('cohorts.courses.no_matching_courses') || 'No courses match your search.'
      : $t('cohorts.courses.no_available_courses') || 'No available courses to add.'
  );
  const multiSelectItems = $derived(
    paginatedCourses.map((course) => ({
      id: course.id,
      label: course.title || course.id,
      description: course.description || undefined
    }))
  );

  async function ensureCoursesLoaded() {
    if (coursesApi.orgCourses.length > 0) {
      return;
    }

    await coursesApi.getOrgCourses();
  }

  function toggleCourse(courseId: string) {
    if (selectedCourseIds.has(courseId)) {
      selectedCourseIds.delete(courseId);
      return;
    }

    selectedCourseIds.add(courseId);
  }

  function handleSearchValueChange(value: string) {
    searchValue = value;
    currentPage = 1;
  }

  function closeModal() {
    selectedCourseIds.clear();
    searchValue = '';
    currentPage = 1;
    open = false;
  }

  function goToPage(page: number) {
    currentPage = page;
  }

  async function handleAdd() {
    const courseIds = [...selectedCourseIds];
    if (courseIds.length === 0) {
      return;
    }

    const didAddCourses = await cohortApi.addCourses(cohortId, courseIds);
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
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('cohorts.courses.add_modal_title') || 'Add Course to Cohort'}</Dialog.Title>
    </Dialog.Header>

    <div class="flex flex-col gap-4 py-2">
      <MultiSelectList
        class="border-0"
        {emptyMessage}
        items={multiSelectItems}
        isLoading={showLoadingState}
        isSelected={(id) => selectedCourseIds.has(id)}
        onSearchValueChange={handleSearchValueChange}
        onToggle={(id) => toggleCourse(id)}
        namePrefix="cohort-course"
        listClass="max-h-60"
        searchPlaceholder={$t('cohorts.courses.search_placeholder') || 'Search courses'}
        bind:searchValue
      >
        {#snippet headingSnippet()}
          <p class="ui:text-sm ui:font-medium">
            {$t('cohorts.courses.select_courses') || $t('cohorts.courses.select_course') || 'Select course(s)'}
            {#if selectedCount > 0}
              <span class="ui:text-muted-foreground text-xs">
                {$t('audience.selected_count', { count: selectedCount })}
              </span>
            {/if}
          </p>
        {/snippet}
      </MultiSelectList>

      {#if totalPages > 1}
        <div class="flex items-center justify-between gap-2 text-sm">
          <span class="ui:text-muted-foreground">
            {$t('cohorts.courses.pagination_status', {
              page: currentPage,
              totalPages
            }) || `Page ${currentPage} of ${totalPages}`}
          </span>

          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onclick={() => goToPage(currentPage - 1)}
              disabled={!canGoToPreviousPage || showLoadingState}
            >
              {$t('app.previous') || 'Previous'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onclick={() => goToPage(currentPage + 1)}
              disabled={!canGoToNextPage || showLoadingState}
            >
              {$t('app.next') || 'Next'}
            </Button>
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={closeModal} disabled={cohortApi.isLoading}>
        {$t('app.cancel') || 'Cancel'}
      </Button>
      <Button onclick={handleAdd} loading={cohortApi.isLoading} disabled={selectedCount === 0 || cohortApi.isLoading}>
        {$t('cohorts.courses.add') || 'Add Course'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
