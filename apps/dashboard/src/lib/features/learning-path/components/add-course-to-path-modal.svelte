<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { pathCoursesApi } from '../api';
  import { CoursePickerList } from '$features/course/components';

  interface Props {
    open: boolean;
    pathId: string;
    onClose: () => void;
  }

  let { open = $bindable(false), pathId, onClose }: Props = $props();

  const selectedCourseIds = new SvelteSet<string>();
  const selectedCount = $derived(selectedCourseIds.size);
  const pickerSource = $derived({ kind: 'learning-path' as const, pathId });

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (!isOpen) {
      selectedCourseIds.clear();
      onClose();
    }
  }

  function closeModal() {
    handleOpenChange(false);
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
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="flex max-h-[85vh] max-w-md flex-col overflow-hidden">
    <Dialog.Header class="shrink-0">
      <Dialog.Title class="ui:text-foreground text-lg font-semibold">
        {$t('learningPath.modals.add_courses.title')}
      </Dialog.Title>
    </Dialog.Header>

    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-2">
      {#if open}
        <CoursePickerList
          source={pickerSource}
          {selectedCourseIds}
          namePrefix="path-course"
          selectCoursesLabel={$t('learningPath.modals.add_courses.select_courses')}
          searchPlaceholder={$t('learningPath.modals.add_courses.search_placeholder')}
          emptyMessage={$t('learningPath.modals.add_courses.no_courses')}
          noMatchesMessage={$t('learningPath.modals.add_courses.no_matches')}
          errorMessage={$t('learningPath.modals.add_courses.load_failed')}
          retryLabel={$t('learningPath.modals.add_courses.retry')}
          paginationStatus={(page, totalPages) =>
            $t('learningPath.modals.add_courses.pagination_status', { page, totalPages })}
        />
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
