<script lang="ts">
  import { onMount } from 'svelte';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Sheet from '@cio/ui/base/sheet';
  import * as Table from '@cio/ui/base/table';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { t } from '$lib/utils/functions/translations';
  import { videoCheckpointApi } from '$features/course/api';
  import type { VideoCheckpointResultAnswer, VideoCheckpointResultRow } from '$features/course/utils/types';
  import { CHECKPOINT_LOW_CORRECT_PERCENT } from './checkpoint-types';
  import { formatCheckpointTimestamp } from './checkpoint-utils';

  interface Props {
    courseId: string;
    lessonId: string;
    onClose: () => void;
  }

  let { courseId, lessonId, onClose }: Props = $props();

  const T = 'course.navItem.lessons.materials.tabs.video.checkpoints';

  let selectedCheckpointId = $state<string | null>(null);

  const results = $derived(videoCheckpointApi.results);
  const selectedRow = $derived(
    results?.checkpoints.find((checkpoint) => checkpoint.checkpointId === selectedCheckpointId) ?? null
  );
  const selectedAnswers = $derived.by((): VideoCheckpointResultAnswer[] => {
    if (!results || !selectedCheckpointId) return [];

    return results.answers
      .filter((answer) => answer.checkpointId === selectedCheckpointId)
      .sort((left, right) => Number(right.isCorrect) - Number(left.isCorrect));
  });
  const waitingCount = $derived(Math.max(0, (results?.enrolledStudentCount ?? 0) - selectedAnswers.length));

  function formatPercent(value: number | null): string {
    return value === null ? '–' : `${value}%`;
  }

  function isLowCorrect(row: VideoCheckpointResultRow): boolean {
    return row.correctPercent !== null && row.correctPercent < CHECKPOINT_LOW_CORRECT_PERCENT;
  }

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) return;

    selectedCheckpointId = null;
    onClose();
  }

  onMount(() => {
    void videoCheckpointApi.loadResults(courseId, lessonId);
  });
</script>

<Sheet.Root open={true} onOpenChange={handleOpenChange}>
  <Sheet.Content class="w-full sm:max-w-2xl" data-testid="video-checkpoint-results-sheet">
    <Sheet.Header>
      <Sheet.Title>{$t(`${T}.results_title`)}</Sheet.Title>
      <Sheet.Description>{$t(`${T}.results_formative`)}</Sheet.Description>
    </Sheet.Header>

    <div class="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-4 pb-4">
      {#if !results}
        <p class="ui:text-muted-foreground py-6 text-sm">
          {videoCheckpointApi.isLoadingResults ? $t(`${T}.results_loading`) : $t(`${T}.results_unavailable`)}
        </p>
      {:else if selectedRow}
        <div class="flex items-start gap-3">
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label={$t(`${T}.results_back`)}
            testId="video-checkpoint-results-back"
            onclick={() => (selectedCheckpointId = null)}
          >
            <ArrowLeftIcon />
          </Button>
          <div class="min-w-0">
            <p class="ui:text-muted-foreground text-sm tabular-nums">
              {formatCheckpointTimestamp(selectedRow.timestampSeconds)}
            </p>
            <p class="font-medium">{selectedRow.title}</p>
          </div>
        </div>

        <p class="ui:text-muted-foreground text-sm">
          {$t(`${T}.responses_summary`, {
            answered: selectedRow.answeredCount,
            total: results.enrolledStudentCount,
            correct: selectedRow.correctCount
          })}
        </p>

        {#if selectedAnswers.length === 0}
          <p class="ui:text-muted-foreground py-4 text-sm">{$t(`${T}.responses_empty`)}</p>
        {:else}
          <ul class="divide-border divide-y" data-testid="video-checkpoint-results-answers">
            {#each selectedAnswers as answer (answer.profileId)}
              {@const displayName = answer.fullname || $t(`${T}.unnamed_student`)}
              <li class="flex items-start gap-3 py-3">
                <UserAvatar src={answer.avatarUrl ?? ''} alt={displayName} class="ui:size-8" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="truncate text-sm font-medium">{displayName}</p>
                    <Badge variant={answer.isCorrect ? 'success' : 'secondary'}>
                      {answer.isCorrect ? $t(`${T}.responses_correct`) : $t(`${T}.responses_answered`)}
                    </Badge>
                  </div>
                  <p class="ui:text-muted-foreground mt-1 text-sm">{answer.answerSummary}</p>
                </div>
              </li>
            {/each}
          </ul>
        {/if}

        {#if waitingCount > 0}
          <p class="ui:text-muted-foreground text-sm">
            {$t(`${T}.responses_waiting_count`, { count: waitingCount })}
          </p>
        {/if}
      {:else}
        <dl class="grid grid-cols-3 gap-3" data-testid="video-checkpoint-results-summary">
          <div class="rounded-md border p-3">
            <dt class="ui:text-muted-foreground text-xs">{$t(`${T}.results_reached`)}</dt>
            <dd class="mt-1 text-xl font-semibold tabular-nums">
              {results.learnersAnsweredAny}
              <span class="ui:text-muted-foreground text-sm font-normal">/ {results.enrolledStudentCount}</span>
            </dd>
          </div>
          <div class="rounded-md border p-3">
            <dt class="ui:text-muted-foreground text-xs">{$t(`${T}.results_answered_all`)}</dt>
            <dd class="mt-1 text-xl font-semibold tabular-nums">{results.learnersAnsweredAll}</dd>
          </div>
          <div class="rounded-md border p-3">
            <dt class="ui:text-muted-foreground text-xs">{$t(`${T}.results_overall_correct`)}</dt>
            <dd class="mt-1 text-xl font-semibold tabular-nums">{formatPercent(results.overallCorrectPercent)}</dd>
          </div>
        </dl>

        {#if results.checkpoints.length === 0}
          <p class="ui:text-muted-foreground py-4 text-sm">{$t(`${T}.empty`)}</p>
        {:else}
          <Table.Root data-testid="video-checkpoint-results-table">
            <Table.Header>
              <Table.Row>
                <Table.Head class="w-16">{$t(`${T}.results_col_time`)}</Table.Head>
                <Table.Head>{$t(`${T}.results_col_question`)}</Table.Head>
                <Table.Head class="text-right">{$t(`${T}.results_col_answered`)}</Table.Head>
                <Table.Head class="text-right">{$t(`${T}.results_col_correct`)}</Table.Head>
                <Table.Head>{$t(`${T}.results_col_wrong`)}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each results.checkpoints as row (row.checkpointId)}
                <Table.Row
                  class="cursor-pointer"
                  tabindex={0}
                  role="button"
                  data-testid="video-checkpoint-results-row"
                  onclick={() => (selectedCheckpointId = row.checkpointId)}
                  onkeydown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectedCheckpointId = row.checkpointId;
                    }
                  }}
                >
                  <Table.Cell class="ui:text-muted-foreground tabular-nums">
                    {formatCheckpointTimestamp(row.timestampSeconds)}
                  </Table.Cell>
                  <Table.Cell class="max-w-48 truncate">{row.title}</Table.Cell>
                  <Table.Cell class="text-right tabular-nums">
                    {row.answeredCount} / {results.enrolledStudentCount}
                  </Table.Cell>
                  <Table.Cell class="text-right tabular-nums">
                    <span class="inline-flex items-center justify-end gap-1.5">
                      {#if isLowCorrect(row)}
                        <Badge variant="warning">{$t(`${T}.results_needs_review`)}</Badge>
                      {/if}
                      {formatPercent(row.correctPercent)}
                    </span>
                  </Table.Cell>
                  <Table.Cell class="ui:text-muted-foreground max-w-40 truncate">
                    {#if row.commonWrongAnswer}
                      {row.commonWrongAnswer.label} ({row.commonWrongAnswer.percent}%)
                    {:else}
                      –
                    {/if}
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        {/if}
      {/if}
    </div>

    <Sheet.Footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          testId="video-checkpoint-results-export"
          loading={videoCheckpointApi.isExporting}
          disabled={!results || results.answers.length === 0}
          onclick={() => videoCheckpointApi.exportResultsCsv(courseId, lessonId)}
        >
          <DownloadIcon />
          {$t(`${T}.results_export`)}
        </Button>
        <Button variant="outline" size="sm" onclick={() => handleOpenChange(false)}>{$t(`${T}.close`)}</Button>
      </div>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
