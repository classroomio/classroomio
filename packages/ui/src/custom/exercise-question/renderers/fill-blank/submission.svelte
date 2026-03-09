<script lang="ts">
  import * as Chart from '../../../../base/chart';
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';

  import { getAnswerForQuestion, getSubmissionLabel, normalizeLabel, withChartColors } from '../submission-utils';

  let {
    question,
    submissions = [],
    labels,
    maxSubmissionItems = 8
  }: Pick<ExerciseQuestionRendererProps, 'question' | 'submissions' | 'labels' | 'maxSubmissionItems'> = $props();

  const chartConfig = $derived({
    responses: {
      label: getSubmissionLabel(labels, 'submission.chart.responses', 'Responses'),
      color: 'var(--chart-1)'
    }
  } satisfies Chart.ChartConfig);

  const series = $derived([
    {
      key: 'responses',
      value: 'responses',
      label: chartConfig.responses.label,
      color: 'var(--color-responses)'
    }
  ]);

  const chartData = $derived.by(() => {
    const byValue = new Map<string, { key: string; label: string; responses: number }>();
    let noAnswerCount = 0;

    for (const submission of submissions || []) {
      const answer = getAnswerForQuestion(submission, question);
      if (!answer || answer.type !== 'FILL_BLANK') {
        noAnswerCount += 1;
        continue;
      }

      const values = answer.values.map((value) => String(value || '').trim()).filter(Boolean);
      if (values.length < 1) {
        noAnswerCount += 1;
        continue;
      }

      for (const value of values) {
        const key = value.toLowerCase();
        const current = byValue.get(key);

        if (!current) {
          byValue.set(key, {
            key,
            label: value,
            responses: 1
          });
          continue;
        }

        current.responses += 1;
      }
    }

    const sorted = [...byValue.values()].sort((a, b) => b.responses - a.responses);

    let rows = sorted;

    if (rows.length > maxSubmissionItems) {
      const kept = rows.slice(0, maxSubmissionItems);
      const otherCount = rows.slice(maxSubmissionItems).reduce((sum, item) => sum + item.responses, 0);

      rows = [
        ...kept,
        {
          key: 'other',
          label: getSubmissionLabel(labels, 'submission.common.other', 'Other'),
          responses: otherCount
        }
      ];
    }

    if (noAnswerCount > 0) {
      rows.push({
        key: 'no-answer',
        label: getSubmissionLabel(labels, 'submission.common.no_answer', 'No answer'),
        responses: noAnswerCount
      });
    }

    return withChartColors(rows.map((row) => ({ ...row, label: normalizeLabel(row.label, row.key) })));
  });
</script>

{#if chartData.length > 0}
  <Chart.Container config={chartConfig} class="ui:h-[280px] ui:w-full">
    <Chart.BarChart
      data={chartData}
      xScale={Chart.scaleBand().padding(0.25)}
      x="label"
      axis="x"
      tooltip={false}
      {series}
    />
  </Chart.Container>
{:else}
  <p class="ui:text-muted-foreground ui:text-sm">
    {getSubmissionLabel(labels, 'submission.chart.no_data', 'No responses yet')}
  </p>
{/if}
