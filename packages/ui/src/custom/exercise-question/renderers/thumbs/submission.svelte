<script lang="ts">
  import * as Chart from '../../../../base/chart';
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';

  import { getAnswerForQuestion, getSubmissionLabel, normalizeLabel, withChartColors } from '../submission-utils';

  let {
    question,
    submissions = [],
    labels
  }: Pick<ExerciseQuestionRendererProps, 'question' | 'submissions' | 'labels'> = $props();

  function resolveBooleanOptionLabel(value: boolean): string {
    const wanted = String(value);

    const option = (question.options || []).find((item) => {
      const optionValue = String(item.value || '')
        .trim()
        .toLowerCase();
      return optionValue === wanted;
    });

    if (!option) return value ? 'Yes' : 'No';

    return normalizeLabel(option.label || option.value, value ? 'Yes' : 'No');
  }

  const chartConfig = $derived({
    responses: {
      label: getSubmissionLabel(labels, 'submission.chart.responses', 'Responses'),
      color: 'var(--chart-1)'
    }
  } satisfies Chart.ChartConfig);

  const chartData = $derived.by(() => {
    let yesCount = 0;
    let noCount = 0;
    let noAnswerCount = 0;

    for (const submission of submissions || []) {
      const answer = getAnswerForQuestion(submission, question);
      if (!answer || answer.type !== 'THUMBS') {
        noAnswerCount += 1;
        continue;
      }

      if (answer.value) {
        yesCount += 1;
      } else {
        noCount += 1;
      }
    }

    const rows: Array<{ key: string; label: string; responses: number }> = [];

    if (yesCount > 0) {
      rows.push({
        key: 'yes',
        label: resolveBooleanOptionLabel(true),
        responses: yesCount
      });
    }

    if (noCount > 0) {
      rows.push({
        key: 'no',
        label: resolveBooleanOptionLabel(false),
        responses: noCount
      });
    }

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
