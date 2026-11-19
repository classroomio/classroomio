<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';

  import { UserAvatar } from '../../../user-avatar';
  import { getAnswerForQuestion, getSubmissionLabel } from '../submission-utils';

  let {
    question,
    submissions = [],
    labels,
    maxSubmissionItems
  }: Pick<ExerciseQuestionRendererProps, 'question' | 'submissions' | 'labels' | 'maxSubmissionItems'> = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  function formatSubmittedAt(value: string | null | undefined): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString();
  }

  const submissionRows = $derived.by(() =>
    (submissions || []).map((submission, index) => {
      const answer = getAnswerForQuestion(submission, question);
      const fileName = answer?.type === 'FILE_UPLOAD' ? answer.fileName?.trim() || answer.fileKey?.trim() || '' : '';
      const studentName = submission.studentName?.trim() || label('submission.list.unknown_student', 'Unknown student');
      const submissionKey = submission.id ?? submission.studentProfileId ?? studentName;

      return {
        key: `${submissionKey}-${index}`,
        studentName,
        avatarUrl: submission.studentAvatarUrl,
        href: submission.studentHref,
        submittedAt: formatSubmittedAt(submission.submittedAt),
        fileName
      };
    })
  );

  const visibleRows = $derived(
    typeof maxSubmissionItems === 'number' && maxSubmissionItems > 0
      ? submissionRows.slice(0, maxSubmissionItems)
      : submissionRows
  );
</script>

<div class="ui:space-y-2">
  <p class="ui:text-muted-foreground ui:text-sm">
    {submissionRows.length}
    {getSubmissionLabel(labels, 'submission.list.responses', 'Responses')}
  </p>

  {#if visibleRows.length > 0}
    <div class="ui:max-h-80 ui:space-y-2 ui:overflow-y-auto ui:pr-1">
      {#each visibleRows as row (row.key)}
        <div class="ui:flex ui:items-center ui:gap-3 ui:rounded-md ui:border ui:px-3 ui:py-2">
          <UserAvatar src={row.avatarUrl} alt={row.studentName} class="ui:size-8 ui:shrink-0" />
          <div class="ui:min-w-0 ui:flex-1">
            {#if row.href}
              <a href={row.href} class="ui:text-primary ui:text-sm ui:font-medium ui:hover:underline">
                {row.studentName}
              </a>
            {:else}
              <p class="ui:text-sm ui:font-medium">{row.studentName}</p>
            {/if}
            {#if row.submittedAt}
              <p class="ui:text-muted-foreground ui:text-xs">{row.submittedAt}</p>
            {/if}
          </div>
          <p class="ui:text-muted-foreground ui:max-w-40 ui:truncate ui:text-xs">
            {row.fileName || label('submission.list.no_file', 'No file')}
          </p>
        </div>
      {/each}
    </div>
  {:else}
    <p class="ui:text-muted-foreground ui:text-sm">
      {getSubmissionLabel(labels, 'submission.list.no_responses', 'No responses yet')}
    </p>
  {/if}
</div>
