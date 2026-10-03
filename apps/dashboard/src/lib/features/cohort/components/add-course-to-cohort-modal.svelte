<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { cohortApi } from '../api';
  import { CoursePickerList } from '$features/course/components';

  interface Props {
    open: boolean;
    cohortId: string;
  }

  let { open = $bindable(false), cohortId }: Props = $props();

  const selectedCourseIds = new SvelteSet<string>();
  const selectedCount = $derived(selectedCourseIds.size);
  const pickerSource = $derived({ kind: 'cohort' as const, cohortId });

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (!isOpen) {
      selectedCourseIds.clear();
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

    const didAddCourses = await cohortApi.addCourses(cohortId, courseIds);
    if (!didAddCourses) {
      return;
    }

    closeModal();
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="flex max-h-[85vh] max-w-md flex-col overflow-hidden">
    <Dialog.Header class="shrink-0">
      <Dialog.Title>{$t('cohorts.courses.add_modal_title')}</Dialog.Title>
    </Dialog.Header>

    <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-2">
      {#if open}
        <CoursePickerList
          source={pickerSource}
          {selectedCourseIds}
          namePrefix="cohort-course"
          selectCoursesLabel={$t('cohorts.courses.select_courses')}
          searchPlaceholder={$t('cohorts.courses.search_placeholder')}
          emptyMessage={$t('cohorts.courses.no_available_courses')}
          noMatchesMessage={$t('cohorts.courses.no_matching_courses')}
          paginationStatus={(page, totalPages) => $t('cohorts.courses.pagination_status', { page, totalPages })}
        />
      {/if}
    </div>

    <Dialog.Footer class="shrink-0 pt-3">
      <Button variant="outline" onclick={closeModal} disabled={cohortApi.isLoading}>
        {$t('app.cancel')}
      </Button>
      <Button onclick={handleAdd} loading={cohortApi.isLoading} disabled={selectedCount === 0 || cohortApi.isLoading}>
        {#if cohortApi.isLoading}
          {$t('cohorts.courses.adding')}
        {:else if selectedCount > 0}
          {$t('cohorts.courses.add_count', { count: selectedCount })}
        {:else}
          {$t('cohorts.courses.add')}
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
