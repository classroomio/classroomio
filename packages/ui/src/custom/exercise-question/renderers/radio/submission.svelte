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

  const chartConfig = $derived({
    responses: {
      label: getSubmissionLabel(labels, 'submission.chart.responses', 'Responses'),
      color: 'var(--chart-1)'
    }
  } satisfies ChartConfig);

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

<SubmissionResponsePieChart
  {chartData}
  {chartConfig}
  emptyLabel={getSubmissionLabel(labels, 'submission.chart.no_data', 'No responses yet')}
/>
