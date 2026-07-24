<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';
  import type { ChartConfig } from '../../../../base/chart/types';

  import SubmissionResponsePieChart from '../shared/submission-response-pie-chart.svelte';
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

    if (!option) return value ? 'True' : 'False';

    return normalizeLabel(option.label || option.value, value ? 'True' : 'False');
  }

  const chartConfig = $derived({
    responses: {
      label: getSubmissionLabel(labels, 'submission.chart.responses', 'Responses'),
      color: 'var(--chart-1)'
    }
  } satisfies ChartConfig);

  const chartData = $derived.by(() => {
    let trueCount = 0;
    let falseCount = 0;
    let noAnswerCount = 0;

    for (const submission of submissions || []) {
      const answer = getAnswerForQuestion(submission, question);
      if (!answer || answer.type !== 'TRUE_FALSE') {
        noAnswerCount += 1;
        continue;
      }

      if (answer.value) {
        trueCount += 1;
      } else {
        falseCount += 1;
      }
    }

    const rows: Array<{ key: string; label: string; responses: number }> = [];

    if (trueCount > 0) {
      rows.push({
        key: 'true',
        label: resolveBooleanOptionLabel(true),
        responses: trueCount
      });
    }

    if (falseCount > 0) {
      rows.push({
        key: 'false',
        label: resolveBooleanOptionLabel(false),
        responses: falseCount
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

<SubmissionResponsePieChart
  {chartData}
  {chartConfig}
  emptyLabel={getSubmissionLabel(labels, 'submission.chart.no_data', 'No responses yet')}
/>
