<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { Button } from '@cio/ui/base/button';
  import * as Table from '@cio/ui/base/table';
  import { formatLastSeen } from '$features/audience/utils/audience-utils';
  import { cohortGoalApi } from '$features/cohort/api';
  import { t } from '$lib/utils/functions/translations';

  import { analyticsApi } from '../../api';
  import { numberCell, textCell } from '../../utils/analytics-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ProgressCell from '../progress-cell.svelte';
  import SortableHead from '../sortable-head.svelte';

  let { widget, result }: WidgetRendererProps = $props();

  const queuedStudentIds = new SvelteSet<string>();
  const sendingStudentIds = new SvelteSet<string>();
  let queuedAllFor = $state<string | null>(null);
  let isRemindingAll = $state(false);

  const pageGroup = $derived(widget.pageGroup ?? widget.id);
  const sort = $derived(analyticsApi.pageState(pageGroup).sort);
  const cohortId = $derived(analyticsApi.scope?.type === 'cohort' ? analyticsApi.scope.id : null);
  const courseKey = $derived(analyticsApi.selection.courseId ?? 'all');
  const isAllQueued = $derived(queuedAllFor === courseKey);
  const overdueKpiRow = $derived(analyticsApi.widgetResult('kpi_overdue')?.rows[0]);
  const remindableCount = $derived(numberCell(overdueKpiRow, 'has_overdue_goal__count_if') ?? 0);

  function handleSort(key: string) {
    void analyticsApi.setSort(pageGroup, key);
  }

  function isQueued(studentId: string): boolean {
    return isAllQueued || queuedStudentIds.has(`${courseKey}:${studentId}`);
  }

  async function remind(studentId: string) {
    if (!cohortId || sendingStudentIds.has(studentId) || isQueued(studentId)) return;

    sendingStudentIds.add(studentId);
    const courseId = analyticsApi.selection.courseId;
    const queuedKey = `${courseId ?? 'all'}:${studentId}`;
    const result = await cohortGoalApi.remindOverdue(cohortId, { courseId, profileId: studentId });
    sendingStudentIds.delete(studentId);

    if (result.enqueued > 0) queuedStudentIds.add(queuedKey);
  }

  async function remindAll() {
    if (!cohortId || isRemindingAll || isAllQueued) return;

    isRemindingAll = true;
    const courseId = analyticsApi.selection.courseId;
    const queuedCourseKey = courseId ?? 'all';
    const result = await cohortGoalApi.remindOverdue(cohortId, { courseId });
    isRemindingAll = false;

    if (result.enqueued > 0) queuedAllFor = queuedCourseKey;
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <SortableHead label={$t('analytics.columns.student')} sortKey="name__value" {sort} onSort={handleSort} />
      <SortableHead label={$t('analytics.columns.course')} sortKey="course_titles__value" {sort} onSort={handleSort} />
      <SortableHead
        label={$t('analytics.columns.progress')}
        sortKey="course_progress_pct__value"
        {sort}
        onSort={handleSort}
      />
      <SortableHead
        label={$t('analytics.columns.last_login')}
        sortKey="last_login_at__value"
        {sort}
        onSort={handleSort}
      />
      {#if cohortId}
        <Table.Head class="w-[1%]"><span class="sr-only">{$t('analytics.columns.actions')}</span></Table.Head>
      {/if}
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row (row['student_id'])}
      {@const studentId = textCell(row, 'student_id') ?? ''}
      {@const lastLoginAt = textCell(row, 'last_login_at__value')}
      {@const isSending = sendingStudentIds.has(studentId)}
      <Table.Row class="h-14">
        <Table.Cell class="font-medium">{textCell(row, 'name__value')}</Table.Cell>
        <Table.Cell>
          <div class="flex max-w-[160px] min-w-[120px] flex-col whitespace-normal">
            <span class="line-clamp-2">{textCell(row, 'course_titles__value') ?? '–'}</span>
            <span class="ui:text-muted-foreground line-clamp-2 text-xs"
              >{textCell(row, 'item_titles__value') ?? ''}</span
            >
          </div>
        </Table.Cell>
        <Table.Cell><ProgressCell value={row['course_progress_pct__value']} /></Table.Cell>
        <Table.Cell class="ui:text-muted-foreground text-xs whitespace-nowrap">
          {lastLoginAt ? formatLastSeen(lastLoginAt) : $t('analytics.never')}
        </Table.Cell>
        {#if cohortId}
          <Table.Cell class="py-1 whitespace-nowrap">
            <div class="flex h-8 items-center justify-end">
              {#if row['has_goal__value'] === true}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={isSending}
                  disabled={isSending || isQueued(studentId)}
                  onclick={() => remind(studentId)}
                >
                  {isQueued(studentId) ? $t('analytics.actions.queued') : $t('analytics.actions.send_reminder')}
                </Button>
              {/if}
            </div>
          </Table.Cell>
        {/if}
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>

{#if cohortId && remindableCount > 0}
  <div class="mt-4 flex">
    <Button
      type="button"
      size="sm"
      loading={isRemindingAll}
      disabled={isRemindingAll || isAllQueued}
      onclick={remindAll}
      testId="analytics-remind-all"
    >
      {isAllQueued
        ? $t('analytics.actions.reminders_queued')
        : $t('analytics.actions.remind_all_overdue', { count: remindableCount })}
    </Button>
  </div>
{/if}
