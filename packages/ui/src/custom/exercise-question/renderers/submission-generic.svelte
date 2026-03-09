<script lang="ts">
  import { extractAnswerDisplayValues, type AnswerData, type ExerciseQuestionRendererProps } from '@cio/question-types';

  import { getAnswerForQuestion, getSubmissionLabel, normalizeLabel } from './submission-utils';

  let {
    question,
    submissions = [],
    labels,
    maxSubmissionItems
  }: Pick<ExerciseQuestionRendererProps, 'question' | 'submissions' | 'labels' | 'maxSubmissionItems'> = $props();

  function summarizeAnswer(answer: AnswerData): string[] {
    switch (answer.type) {
      case 'TEXTAREA':
      case 'SHORT_ANSWER':
        return [answer.text];
      case 'NUMERIC':
        return [String(answer.value)];
      case 'LINK':
        return answer.urls;
      case 'FILE_UPLOAD':
        return [answer.fileName || answer.fileKey];
      case 'MATCHING':
        return [`${answer.pairs.length} pair(s)`];
      case 'ORDERING':
        return [answer.orderedValues.join(' -> ')];
      case 'HOTSPOT':
        return [`${answer.coordinates.length} point(s)`];
      default: {
        const display = extractAnswerDisplayValues(answer);
        if (typeof display.text === 'string' && display.text.trim().length > 0) {
          return [display.text];
        }

        return display.selectedValues.map((value) => String(value));
      }
    }
  }

  const responseRows = $derived.by(() => {
    const bySummary = new Map<string, number>();

    for (const submission of submissions || []) {
      const answer = getAnswerForQuestion(submission, question);
      if (!answer) continue;

      const values = summarizeAnswer(answer)
        .map((item) => normalizeLabel(item, ''))
        .filter(Boolean);
      if (values.length < 1) continue;

      for (const value of values) {
        bySummary.set(value, (bySummary.get(value) || 0) + 1);
      }
    }

    const rows = [...bySummary.entries()]
      .map(([label, responses]) => ({ label, responses }))
      .sort((a, b) => b.responses - a.responses);

    if (typeof maxSubmissionItems === 'number' && maxSubmissionItems > 0) {
      return rows.slice(0, maxSubmissionItems);
    }

    return rows;
  });

  const totalResponses = $derived(responseRows.reduce((sum, row) => sum + row.responses, 0));
</script>

<div class="ui:space-y-2">
  <p class="ui:text-muted-foreground ui:text-sm">
    {totalResponses}
    {getSubmissionLabel(labels, 'submission.list.responses', 'Responses')}
  </p>

  {#if responseRows.length > 0}
    <div class="ui:max-h-80 ui:space-y-2 ui:overflow-y-auto ui:pr-1">
      {#each responseRows as row (`${row.label}-${row.responses}`)}
        <div class="ui:flex ui:items-center ui:justify-between ui:gap-3 ui:rounded-md ui:border ui:px-3 ui:py-2">
          <p class="ui:text-sm">{row.label}</p>
          <span class="ui:text-muted-foreground ui:text-xs">{row.responses}</span>
        </div>
      {/each}
    </div>
  {:else}
    <p class="ui:text-muted-foreground ui:text-sm">
      {getSubmissionLabel(labels, 'submission.list.no_responses', 'No responses yet')}
    </p>
  {/if}
</div>
