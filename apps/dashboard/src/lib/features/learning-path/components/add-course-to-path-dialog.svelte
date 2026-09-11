<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { MultiSelectList } from '@cio/ui/custom/multi-select-list';
  import { t } from '$lib/utils/functions/translations';
  import { learningPathApi } from '../api';
  import { coursesApi } from '$features/course/api';
  import { MOCK_AVAILABLE_ORG_COURSES } from '../utils/mock-data';

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
  let isSubmitting = $state(false);
  const selectedCourseIds = new SvelteSet<string>();

  const existingSet = $derived(new Set(existingCourseIds));

  // Combine coursesApi.orgCourses if loaded, else fallback to mock courses
  const allSourceCourses = $derived.by(() => {
    if (coursesApi.orgCourses && coursesApi.orgCourses.length > 0) {
      return coursesApi.orgCourses.map((c) => ({
        id: c.id,
        title: c.title || c.id,
        description: c.description || undefined
      }));
    }
    return MOCK_AVAILABLE_ORG_COURSES.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description
    }));
  });

  const availableCourses = $derived(allSourceCourses.filter((course) => !existingSet.has(course.id)));

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

  const multiSelectItems = $derived(
    paginatedCourses.map((c) => ({
      id: c.id,
      label: c.title,
      description: c.description
    }))
  );

  function toggleCourse(courseId: string) {
    if (selectedCourseIds.has(courseId)) {
      selectedCourseIds.delete(courseId);
    } else {
      selectedCourseIds.add(courseId);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;
    if (!isOpen) {
      selectedCourseIds.clear();
      searchValue = '';
      currentPage = 1;
      onClose();
    }
  }

  async function handleAdd() {
    const courseIds = [...selectedCourseIds];
    if (courseIds.length === 0 || isSubmitting) return;

    isSubmitting = true;
    try {
      await learningPathApi.addCourses(pathId, courseIds);
      selectedCourseIds.clear();
      searchValue = '';
      open = false;
      onClose();
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="bg-card text-foreground border-border max-w-md border">
    <Dialog.Header>
      <Dialog.Title class="text-foreground text-lg font-semibold">
        {$t('learningPath.modals.add_courses.title')}
      </Dialog.Title>
      <Dialog.Description class="text-muted-foreground text-sm">
        {$t('learningPath.modals.add_courses.description')}
      </Dialog.Description>
    </Dialog.Header>

    <div class="my-3">
      <MultiSelectList
        items={multiSelectItems}
        selectedIds={selectedCourseIds}
        {searchValue}
        onSearchValueChange={(val) => {
          searchValue = val;
          currentPage = 1;
        }}
        onToggle={toggleCourse}
        emptyMessage={searchValue.trim()
          ? $t('learningPath.modals.add_courses.no_matches')
          : $t('learningPath.modals.add_courses.no_courses')}
        searchPlaceholder={$t('learningPath.modals.add_courses.search_placeholder')}
        {currentPage}
        {totalPages}
        canGoToPreviousPage={currentPage > 1}
        canGoToNextPage={currentPage < totalPages}
        onPreviousPage={() => (currentPage = Math.max(1, currentPage - 1))}
        onNextPage={() => (currentPage = Math.min(totalPages, currentPage + 1))}
      />
    </div>

    <Dialog.Footer class="gap-2 sm:gap-0">
      <Button
        type="button"
        variant="outline"
        onclick={() => {
          open = false;
          onClose();
        }}
      >
        {$t('learningPath.modals.add_courses.cancel')}
      </Button>
      <Button type="button" variant="primary" disabled={selectedCount === 0 || isSubmitting} onclick={handleAdd}>
        {#if isSubmitting}
          {$t('learningPath.modals.add_courses.submitting')}
        {:else}
          Add {selectedCount} {selectedCount === 1 ? 'Course' : 'Courses'}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
