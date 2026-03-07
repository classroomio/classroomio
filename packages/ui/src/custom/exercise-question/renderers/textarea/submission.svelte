<script lang="ts">
  import type { ExerciseQuestionRendererProps } from '@cio/question-types';
  import { sanitizeHtml } from '../../../../tools/sanitize';

  import { getAnswerForQuestion, getSubmissionLabel } from '../submission-utils';

  let {
    question,
    submissions = [],
    labels,
    maxSubmissionItems
  }: Pick<ExerciseQuestionRendererProps, 'question' | 'submissions' | 'labels' | 'maxSubmissionItems'> = $props();

  const responseRows = $derived.by(() => {
    const byHtml = new Map<string, number>();

    for (const submission of submissions || []) {
      const answer = getAnswerForQuestion(submission, question);
      if (!answer || answer.type !== 'TEXTAREA') continue;

      const rawHtml = String(answer.text || '').trim();
      if (rawHtml.length < 1) continue;

      const safeHtml = sanitizeHtml(rawHtml).trim();
      if (safeHtml.length < 1) continue;

      byHtml.set(safeHtml, (byHtml.get(safeHtml) || 0) + 1);
    }

    const rows = [...byHtml.entries()]
      .map(([html, responses]) => ({ html, responses }))
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
      {#each responseRows as row, index (`${index}-${row.responses}`)}
        <div class="ui:flex ui:items-start ui:justify-between ui:gap-3 ui:rounded-md ui:border ui:px-3 ui:py-2">
          <div class="ui:min-w-0 ui:flex-1 ui:break-words ui:text-sm">
            {@html row.html}
          </div>
          <span class="ui:text-muted-foreground ui:mt-0.5 ui:shrink-0 ui:text-xs">{row.responses}</span>
        </div>
      {/each}
    </div>
  {:else}
    <p class="ui:text-muted-foreground ui:text-sm">
      {getSubmissionLabel(labels, 'submission.list.no_responses', 'No responses yet')}
    </p>
  {/if}
</div>
