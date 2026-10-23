<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Table from '@cio/ui/base/table';
  import { cohortGoalApi } from '$features/cohort/api';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../../api';
  import { formatCount, textCell } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';

  let { result }: WidgetRendererProps = $props();

  const pendingLearnerIds = new SvelteSet<string>();

  const cohortId = $derived(insightsApi.scope?.type === 'cohort' ? insightsApi.scope.id : null);
  const hasGoalRows = $derived(result.rows.some((row) => row['kind__value'] === 'goal'));
  const hasReminders = $derived(result.rows.some((row) => Boolean(textCell(row, 'assignment_id__value'))));
  const showReminderColumn = $derived(Boolean(cohortId) && hasReminders);
  let isRemindingAll = $state(false);

  async function remind(profileId: string) {
    if (!cohortId || pendingLearnerIds.has(profileId)) return;

    pendingLearnerIds.add(profileId);
    await cohortGoalApi.remindOverdue(cohortId, {
      courseId: insightsApi.selection.courseId,
      profileId
    });
    pendingLearnerIds.delete(profileId);
  }

  async function remindAll() {
    if (!cohortId || isRemindingAll) return;

    isRemindingAll = true;
    await cohortGoalApi.remindOverdue(cohortId, { courseId: insightsApi.selection.courseId });
    isRemindingAll = false;
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>{$t('insights.columns.learner')}</Table.Head>
      <Table.Head>{$t('insights.columns.overdue_item')}</Table.Head>
      <Table.Head class="text-right">{$t('insights.columns.days_overdue')}</Table.Head>
      {#if showReminderColumn}<Table.Head class="w-[1%]"></Table.Head>{/if}
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each result.rows as row (row['item_id'])}
      {@const learnerId = textCell(row, 'learner__id')}
      <Table.Row>
        <Table.Cell class="font-medium">{textCell(row, 'name__value')}</Table.Cell>
        <Table.Cell>
          <div class="flex flex-col gap-1 whitespace-normal">
            <span>{textCell(row, 'title__value')}</span>
            <span class="ui:text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary">{$t(`insights.overdue_kind.${row['kind__value']}`)}</Badge>
              {textCell(row, 'course_titles__value') ?? ''}
            </span>
          </div>
        </Table.Cell>
        <Table.Cell class="text-right tabular-nums">{formatCount(row['days_overdue__value'])}</Table.Cell>
        {#if showReminderColumn}
          <Table.Cell>
            {#if learnerId}
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={pendingLearnerIds.has(learnerId)}
                disabled={pendingLearnerIds.has(learnerId)}
                onclick={() => remind(learnerId)}
              >
                {$t('insights.actions.send_reminder')}
              </Button>
            {/if}
          </Table.Cell>
        {/if}
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>

{#if cohortId && hasGoalRows}
  <div class="mt-4 flex justify-end">
    <Button
      type="button"
      size="sm"
      loading={isRemindingAll}
      disabled={isRemindingAll}
      onclick={remindAll}
      testId="insights-remind-all"
    >
      {$t('insights.actions.remind_all_overdue')}
    </Button>
  </div>
{/if}
