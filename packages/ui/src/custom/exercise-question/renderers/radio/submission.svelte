<script lang="ts">
  import * as Chart from '../../../../base/chart';
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';

  import { getAnswerForQuestion, getSubmissionLabel, normalizeLabel, withChartColors } from '../submission-utils';

  let {
    question,
    submissions = [],
    labels
  }: Pick<ExerciseQuestionRendererProps, 'question' | 'submissions' | 'labels'> = $props();

  const chartConfig = $derived({
    responses: {
      label: getSubmissionLabel(labels, 'submission.chart.responses', 'Responses'),
      color: 'var(--chart-1)'
    }
  } satisfies Chart.ChartConfig);

  const chartData = $derived.by(() => {
    const byOptionId = new Map<string, { key: string; label: string; responses: number }>();
    for (const option of question.options || []) {
      const optionId = option.id == null ? '' : String(option.id);
      if (!optionId) continue;

      byOptionId.set(optionId, {
        key: optionId,
        label: normalizeLabel(option.label || option.value, optionId),
        responses: 0
      });
    }

    let noAnswerCount = 0;

    for (const submission of submissions || []) {
      const answer = getAnswerForQuestion(submission, question);
      if (!answer || answer.type !== 'RADIO') {
        noAnswerCount += 1;
        continue;
      }

      const option = byOptionId.get(String(answer.optionId));
      if (!option) {
        noAnswerCount += 1;
        continue;
      }

      option.responses += 1;
    }

    const rows = [...byOptionId.values()].filter((item) => item.responses > 0);

    if (noAnswerCount > 0) {
      rows.push({
        key: 'no-answer',
        label: getSubmissionLabel(labels, 'submission.common.no_answer', 'No answer'),
        responses: noAnswerCount
      });
    }

    return withChartColors(rows);
  });
</script>

{#if chartData.length > 0}
  <Chart.Container config={chartConfig} class="ui:h-[280px] ui:w-full ui:flex-col ui:items-center">
    <Chart.PieChart data={chartData} key="key" label="label" value="responses" c="color" />
    <Chart.ChartLegend items={chartData.map((d) => ({ label: d.label, color: d.color, value: d.responses }))} />
  </Chart.Container>
{:else}
  <p class="ui:text-muted-foreground ui:text-sm">
    {getSubmissionLabel(labels, 'submission.chart.no_data', 'No responses yet')}
  </p>
{/if}
