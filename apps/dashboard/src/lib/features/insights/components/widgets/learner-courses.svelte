<script lang="ts">
  import { Progress } from '@cio/ui/base/progress';
  import * as Table from '@cio/ui/base/table';
  import { t } from '$lib/utils/functions/translations';

  import { formatPercent, LEARNER_DETAIL_ELEMENT_ID, numberCell, textCell } from '../../utils/insights-utils';
  import type { WidgetRendererProps } from '../../utils/types';

  let { result }: WidgetRendererProps = $props();
</script>

<div id={LEARNER_DETAIL_ELEMENT_ID} class="scroll-mt-24">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>{$t('insights.columns.course')}</Table.Head>
        <Table.Head class="w-[180px]">{$t('insights.columns.progress')}</Table.Head>
        <Table.Head>{$t('insights.columns.now_at')}</Table.Head>
        <Table.Head class="text-right">{$t('insights.columns.average_score')}</Table.Head>
        <Table.Head class="text-right">{$t('insights.columns.required_passed')}</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each result.rows as row (row['course_id'])}
        {@const progress = numberCell(row, 'progress_pct__value') ?? 0}
        {@const requiredTotal = numberCell(row, 'required_total__value') ?? 0}
        {@const requiredPassed = numberCell(row, 'required_passed__value') ?? 0}
        <Table.Row>
          <Table.Cell class="font-medium">{textCell(row, 'course_label')}</Table.Cell>
          <Table.Cell>
            <div class="flex items-center gap-2">
              <Progress value={progress} class="h-2" />
              <span class="w-10 text-right text-xs tabular-nums">{Math.round(progress)}%</span>
            </div>
          </Table.Cell>
          <Table.Cell class="ui:text-muted-foreground">
            {progress >= 100 ? $t('insights.finished') : (textCell(row, 'now_at_title__value') ?? '–')}
          </Table.Cell>
          <Table.Cell class="text-right tabular-nums">{formatPercent(row['avg_score_pct__value'])}</Table.Cell>
          <Table.Cell class="text-right tabular-nums">
            {requiredTotal > 0
              ? $t('insights.required_passed_of', { passed: requiredPassed, total: requiredTotal })
              : '–'}
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
