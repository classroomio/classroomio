<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';

  import type { SubmissionFilterOption } from '$features/course/utils/submission-board-filters';

  import SubmissionMultiSelect from './submission-multi-select.svelte';

  interface Props {
    studentOptions: SubmissionFilterOption[];
    exerciseOptions: SubmissionFilterOption[];
    selectedStudentIds: string[];
    selectedExerciseIds: string[];
    visibleCount: number;
    totalCount: number;
    onStudentIdsChange: (ids: string[]) => void;
    onExerciseIdsChange: (ids: string[]) => void;
    onReset: () => void;
  }

  let {
    studentOptions,
    exerciseOptions,
    selectedStudentIds,
    selectedExerciseIds,
    visibleCount,
    totalCount,
    onStudentIdsChange,
    onExerciseIdsChange,
    onReset
  }: Props = $props();

  const hasFilters = $derived(selectedStudentIds.length > 0 || selectedExerciseIds.length > 0);
</script>

<div class="mb-4 flex flex-col gap-3">
  <div class="flex flex-wrap items-center gap-2">
    <SubmissionMultiSelect
      label={$t('course.navItem.submissions.filter.students')}
      searchPlaceholder={$t('course.navItem.submissions.filter.search_students')}
      selectAllLabel={$t('course.navItem.submissions.filter.select_all')}
      clearLabel={$t('course.navItem.submissions.filter.clear')}
      onlyLabel={$t('course.navItem.submissions.filter.only')}
      emptyLabel={$t('course.navItem.submissions.filter.no_matches')}
      options={studentOptions}
      selectedIds={selectedStudentIds}
      testId="submissions-filter-students"
      onSelectedIdsChange={onStudentIdsChange}
    />
    <SubmissionMultiSelect
      label={$t('course.navItem.submissions.filter.exercises')}
      searchPlaceholder={$t('course.navItem.submissions.filter.search_exercises')}
      selectAllLabel={$t('course.navItem.submissions.filter.select_all')}
      clearLabel={$t('course.navItem.submissions.filter.clear')}
      onlyLabel={$t('course.navItem.submissions.filter.only')}
      emptyLabel={$t('course.navItem.submissions.filter.no_matches')}
      options={exerciseOptions}
      selectedIds={selectedExerciseIds}
      testId="submissions-filter-exercises"
      onSelectedIdsChange={onExerciseIdsChange}
    />
    <Button
      type="button"
      variant="outline"
      size="sm"
      testId="submissions-filter-reset"
      disabled={!hasFilters}
      onclick={onReset}
    >
      {$t('course.navItem.submissions.filter.reset')}
    </Button>
  </div>
  <p class="ui:text-muted-foreground text-sm">
    {$t('course.navItem.submissions.filter.visible_of_total', { visible: visibleCount, total: totalCount })}
  </p>
</div>
