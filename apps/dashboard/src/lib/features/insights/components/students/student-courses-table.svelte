<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import * as Table from '@cio/ui/base/table';
  import { cn } from '@cio/ui/tools';
  import { INSIGHTS_LIMITS } from '@cio/utils/constants/insights';
  import { TablePagination } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  import { insightsStudentSheetApi } from '../../api';
  import { exercisesPassedTone, nowAtLabel, numberCell, textCell, TONE_CELL_CLASS } from '../../utils/insights-utils';
  import type { InsightsResult } from '../../utils/types';
  import HeatCell from '../heat-cell.svelte';
  import ProgressCell from '../progress-cell.svelte';
  import SortableHead from '../sortable-head.svelte';

  interface Props {
    result: InsightsResult;
    onSelectCourse?: (courseId: string) => void;
  }

  let { result, onSelectCourse }: Props = $props();

  const sort = $derived(insightsStudentSheetApi.coursesPage.sort);
  const page = $derived(insightsStudentSheetApi.coursesPage.page);
  const hasPages = $derived(result.total > INSIGHTS_LIMITS.cardPageSize);

  function handleSort(key: string) {
    void insightsStudentSheetApi.setCoursesSort(key);
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <SortableHead label={$t('insights.columns.course')} sortKey="course" {sort} onSort={handleSort} />
      <SortableHead
        label={$t('insights.columns.progress')}
        sortKey="progress_pct__value"
        {sort}
        onSort={handleSort}
        align="left"
      />
      <SortableHead
        label={$t('insights.columns.now_at')}
        sortKey="now_at_title__value"
        {sort}
        onSort={handleSort}
        align="left"
      />
      <SortableHead
        label={$t('insights.columns.average_score')}
        sortKey="avg_score_pct__value"
        {sort}
        onSort={handleSort}
        align="center"
      />
      <SortableHead
        label={$t('insights.columns.exercises_passed')}
        sortKey="pass_mark_passed__value"
        hint={$t('insights.column_hints.exercises_passed')}
        {sort}
        onSort={handleSort}
        align="center"
      />
      {#if onSelectCourse}
        <Table.Head class="w-8"></Table.Head>
      {/if}
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row (row['course_id'])}
      {@const courseId = textCell(row, 'course_id') ?? ''}
      {@const progress = numberCell(row, 'progress_pct__value')}
      {@const passMarkExercises = numberCell(row, 'pass_mark_exercises__value') ?? 0}
      {@const passMarkPassed = numberCell(row, 'pass_mark_passed__value') ?? 0}
      {@const stillToPass = numberCell(row, 'still_to_pass__value') ?? 0}
      {@const passedTone = exercisesPassedTone(passMarkPassed, passMarkExercises, stillToPass)}
      <Table.Row class={cn(onSelectCourse && 'cursor-pointer')} onclick={() => onSelectCourse?.(courseId)}>
        <Table.Cell class="font-medium">
          {#if onSelectCourse}
            <button
              type="button"
              class="ui:focus-visible:ring-ring rounded-sm text-left font-medium focus-visible:ring-2 focus-visible:outline-none"
              onclick={(event) => {
                event.stopPropagation();
                onSelectCourse(courseId);
              }}
            >
              {textCell(row, 'course_label')}
            </button>
          {:else}
            {textCell(row, 'course_label')}
          {/if}
        </Table.Cell>
        <Table.Cell><ProgressCell value={progress} /></Table.Cell>
        <Table.Cell class="ui:text-muted-foreground">
          {nowAtLabel(progress, textCell(row, 'now_at_title__value'), $t)}
        </Table.Cell>
        <Table.Cell class="text-center"><HeatCell value={row['avg_score_pct__value']} /></Table.Cell>
        <Table.Cell class="text-center">
          {#if passMarkExercises > 0}
            <span class={cn('rounded-md px-2 py-1 text-xs tabular-nums', TONE_CELL_CLASS[passedTone])}>
              {$t('insights.of_total', { count: passMarkPassed, total: passMarkExercises })}
            </span>
          {:else}
            <span class="ui:text-muted-foreground">–</span>
          {/if}
        </Table.Cell>
        {#if onSelectCourse}
          <Table.Cell class="ui:text-muted-foreground w-8 text-right">
            <ChevronRightIcon class="inline size-4" />
          </Table.Cell>
        {/if}
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>

{#if hasPages}
  <div class="pt-4">
    <TablePagination
      count={result.total}
      perPage={INSIGHTS_LIMITS.cardPageSize}
      {page}
      onPageChange={(next) => insightsStudentSheetApi.setCoursesPage(next)}
    />
  </div>
{/if}
