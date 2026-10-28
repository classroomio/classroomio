<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { Button } from '@cio/ui/base/button';
  import * as Table from '@cio/ui/base/table';
  import { formatLastSeen } from '$features/audience/utils/audience-utils';
  import { cohortGoalApi } from '$features/cohort/api';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { numberCell, textCell } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';
  import ProgressCell from '../progress-cell.svelte';
  import SortableHead from '../sortable-head.svelte';

  let { widget, result }: WidgetRendererProps = $props();

  const queuedStudentIds = new SvelteSet<string>();
  const sendingStudentIds = new SvelteSet<string>();
  let queuedAllFor = $state<string | null>(null);
  let isRemindingAll = $state(false);

  const pageGroup = $derived(widget.pageGroup ?? widget.id);
  const sort = $derived(insightsApi.pageState(pageGroup).sort);
  const cohortId = $derived(insightsApi.scope?.type === 'cohort' ? insightsApi.scope.id : null);
  const courseKey = $derived(insightsApi.selection.courseId ?? 'all');
  const isAllQueued = $derived(queuedAllFor === courseKey);
  const overdueKpiRow = $derived(insightsApi.widgetResult('kpi_overdue')?.rows[0]);
  const remindableCount = $derived(numberCell(overdueKpiRow, 'has_overdue_goal__count_if') ?? 0);

  function handleSort(key: string) {
    void insightsApi.setSort(pageGroup, key);
  }

  function isQueued(studentId: string): boolean {
    return isAllQueued || queuedStudentIds.has(studentId);
  }

  async function remind(studentId: string) {
    if (!cohortId || sendingStudentIds.has(studentId) || isQueued(studentId)) return;

    sendingStudentIds.add(studentId);
    const courseId = insightsApi.selection.courseId;
    const enqueued = await cohortGoalApi.remindOverdue(cohortId, { courseId, profileId: studentId });
    sendingStudentIds.delete(studentId);

    if (enqueued > 0) queuedStudentIds.add(studentId);
  }

  async function remindAll() {
    if (!cohortId || isRemindingAll || isAllQueued) return;

    isRemindingAll = true;
    const courseId = insightsApi.selection.courseId;
    const enqueued = await cohortGoalApi.remindOverdue(cohortId, { courseId });
    isRemindingAll = false;

    if (enqueued > 0) queuedAllFor = courseKey;
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <SortableHead label={$t('insights.columns.student')} sortKey="name__value" {sort} onSort={handleSort} />
      <SortableHead label={$t('insights.columns.course')} sortKey="course_titles__value" {sort} onSort={handleSort} />
      <SortableHead
        label={$t('insights.columns.progress')}
        sortKey="course_progress_pct__value"
        {sort}
        onSort={handleSort}
      />
      <SortableHead
        label={$t('insights.columns.last_login')}
        sortKey="last_login_at__value"
        {sort}
        onSort={handleSort}
      />
      {#if cohortId}
        <Table.Head class="w-[1%]"><span class="sr-only">{$t('insights.columns.actions')}</span></Table.Head>
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
          {lastLoginAt ? formatLastSeen(lastLoginAt) : $t('insights.never')}
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
                  {isQueued(studentId) ? $t('insights.actions.queued') : $t('insights.actions.send_reminder')}
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
      testId="insights-remind-all"
    >
      {isAllQueued
        ? $t('insights.actions.reminders_queued')
        : $t('insights.actions.remind_all_overdue', { count: remindableCount })}
    </Button>
  </div>
{/if}
