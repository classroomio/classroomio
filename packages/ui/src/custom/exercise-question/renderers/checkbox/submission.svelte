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

  const series = $derived([
    {
      key: 'responses',
      value: 'responses',
      label: chartConfig.responses.label,
      color: 'var(--color-responses)'
    }
  ]);

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
      if (!answer || answer.type !== 'CHECKBOX' || answer.optionIds.length < 1) {
        noAnswerCount += 1;
        continue;
      }

      let hadKnownOption = false;
      for (const optionId of answer.optionIds) {
        const option = byOptionId.get(String(optionId));
        if (!option) continue;
        hadKnownOption = true;
        option.responses += 1;
      }

      if (!hadKnownOption) {
        noAnswerCount += 1;
      }
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
