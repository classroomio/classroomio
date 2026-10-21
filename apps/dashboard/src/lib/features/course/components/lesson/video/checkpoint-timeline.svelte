<script lang="ts">
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { t } from '$lib/utils/functions/translations';
  import { isFreePlan } from '$lib/utils/store/org';
  import { snackbar } from '$features/ui/snackbar/store';
  import { DeleteModal, UpgradeBanner } from '$features/ui';
  import { QUESTION_TYPES } from '$features/ui/question/constants';
  import { lessonApi, videoCheckpointApi } from '$features/course/api';
  import type { VideoCheckpoint } from '$features/course/utils/types';
  import { getExerciseEditorQuestionTypeLabel } from '$features/course/components/exercise/question-type-utils';
  import { lessonVideoBus } from './lesson-video-bus.svelte';
  import {
    checkpointPercent,
    findCheckpointCollision,
    formatCheckpointTimestamp,
    toCheckpointRequestBody
  } from './checkpoint-utils';
  import CheckpointEditorSheet from './checkpoint-editor-sheet.svelte';
  import CheckpointResultsSheet from './checkpoint-results-sheet.svelte';

  interface Props {
    courseId: string;
    lessonId: string;
    assetId: string;
    durationSeconds: number;
  }

  let { courseId, lessonId, assetId, durationSeconds }: Props = $props();

  const T = 'course.navItem.lessons.materials.tabs.video.checkpoints';

  let editorOpen = $state(false);
  let resultsOpen = $state(false);
  let activeCheckpoint = $state<VideoCheckpoint | null>(null);
  let checkpointToDelete = $state<VideoCheckpoint | null>(null);
  let openDeleteModal = $state(false);
  let draggingId = $state<string | null>(null);

  const checkpoints = $derived(videoCheckpointApi.forAsset(assetId));
  const playheadSeconds = $derived(lessonVideoBus.currentTimeSeconds);
  const knownDuration = $derived(durationSeconds || lessonVideoBus.durationSeconds || 0);
  const playheadPercent = $derived(checkpointPercent(playheadSeconds, knownDuration));
  const hasUnsavedLessonChanges = $derived(lessonApi.isDirty);
  const canAdd = $derived(knownDuration > 0 && !$isFreePlan && !hasUnsavedLessonChanges);

  function typeLabel(checkpoint: VideoCheckpoint): string {
    const typeEntry = QUESTION_TYPES.find((entry) => entry.key === checkpoint.question.questionType);

    return getExerciseEditorQuestionTypeLabel(typeEntry);
  }

  function resumeLabel(checkpoint: VideoCheckpoint): string {
    return checkpoint.resumePolicy === 'correct'
      ? t.get('course.navItem.lessons.materials.tabs.video.checkpoints.resume_correct')
      : t.get('course.navItem.lessons.materials.tabs.video.checkpoints.resume_any');
  }

  function openAdd() {
    activeCheckpoint = null;
    editorOpen = true;
  }

  function openEdit(checkpoint: VideoCheckpoint) {
    activeCheckpoint = checkpoint;
    editorOpen = true;
  }

  function handleEditorClose() {
    editorOpen = false;
    activeCheckpoint = null;
  }

  function requestRemove(checkpoint: VideoCheckpoint) {
    checkpointToDelete = checkpoint;
    openDeleteModal = true;
  }

  async function confirmRemove() {
    const checkpoint = checkpointToDelete;
    checkpointToDelete = null;
    openDeleteModal = false;
    if (!checkpoint) return;

    await videoCheckpointApi.remove(courseId, lessonId, checkpoint.id);
  }

  function seekTo(seconds: number) {
    lessonVideoBus.seek(seconds);
  }

  function secondsFromRail(clientX: number, rail: HTMLElement): number {
    const rect = rail.getBoundingClientRect();
    const ratio = rect.width <= 0 ? 0 : Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));

    return Math.round(ratio * knownDuration);
  }

  function handleRailClick(event: MouseEvent & { currentTarget: EventTarget & HTMLElement }) {
    if (!knownDuration) return;
    if ((event.target as HTMLElement).closest('[data-checkpoint-marker]')) return;

    seekTo(secondsFromRail(event.clientX, event.currentTarget));
  }

  async function moveCheckpoint(checkpoint: VideoCheckpoint, timestampSeconds: number) {
    if (timestampSeconds === checkpoint.timestampSeconds || $isFreePlan) return;

    const body = toCheckpointRequestBody({
      timestampSeconds,
      resumePolicy: checkpoint.resumePolicy === 'correct' ? 'correct' : 'any',
      question: checkpoint.question
    });
    await videoCheckpointApi.update(courseId, lessonId, checkpoint.id, body);
  }

  function handleMarkerPointerDown(event: PointerEvent, checkpoint: VideoCheckpoint) {
    event.preventDefault();
    event.stopPropagation();
    draggingId = checkpoint.id;
    seekTo(checkpoint.timestampSeconds);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function handleMarkerPointerMove(event: PointerEvent, rail: HTMLElement, checkpoint: VideoCheckpoint) {
    if (draggingId !== checkpoint.id || !knownDuration) return;

    const nextSeconds = secondsFromRail(event.clientX, rail);
    seekTo(nextSeconds);
  }

  function handleMarkerPointerUp(event: PointerEvent, rail: HTMLElement, checkpoint: VideoCheckpoint) {
    if (draggingId !== checkpoint.id) return;

    draggingId = null;
    const nextSeconds = secondsFromRail(event.clientX, rail);
    const collision = findCheckpointCollision(checkpoints, nextSeconds, checkpoint.id);
    if (collision) {
      snackbar.error('snackbar.lesson_video.checkpoint_collision');
      seekTo(checkpoint.timestampSeconds);
      return;
    }

    seekTo(nextSeconds);
    void moveCheckpoint(checkpoint, nextSeconds);
  }
</script>

<div class="mt-6 space-y-4">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <p class="font-semibold">{$t(`${T}.heading`)}</p>
      <p class="ui:text-muted-foreground mt-1 text-sm">{$t(`${T}.subheading`)}</p>
    </div>
    <div class="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        testId="video-checkpoint-results"
        disabled={$isFreePlan || checkpoints.length === 0}
        onclick={() => (resultsOpen = true)}
      >
        {$t(`${T}.results_button`)}
      </Button>
      <Button
        type="button"
        variant="secondary"
        testId="video-checkpoint-add-question"
        disabled={!canAdd}
        onclick={openAdd}
      >
        {$t(`${T}.add_at`, { time: formatCheckpointTimestamp(playheadSeconds) })}
      </Button>
    </div>
  </div>

  <UpgradeBanner visible={$isFreePlan}>{$t(`${T}.upgrade_message`)}</UpgradeBanner>

  {#if hasUnsavedLessonChanges && !$isFreePlan}
    <p class="ui:text-muted-foreground text-sm" data-testid="video-checkpoint-save-first">
      {$t(`${T}.save_lesson_first`)}
    </p>
  {/if}

  {#if knownDuration > 0}
    <div
      class="ui:bg-muted relative h-2 cursor-pointer rounded-full"
      role="slider"
      tabindex="0"
      aria-valuemin={0}
      aria-valuemax={Math.floor(knownDuration)}
      aria-valuenow={Math.floor(playheadSeconds)}
      aria-label={$t(`${T}.timeline_label`)}
      onclick={handleRailClick}
      onkeydown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          seekTo(Math.max(0, playheadSeconds - 1));
        }

        if (event.key === 'ArrowRight') {
          event.preventDefault();
          seekTo(Math.min(knownDuration, playheadSeconds + 1));
        }
      }}
    >
      <div class="ui:bg-primary absolute inset-y-0 left-0 rounded-full" style:width="{playheadPercent}%"></div>
      {#each checkpoints as checkpoint (checkpoint.id)}
        <button
          type="button"
          data-checkpoint-marker={checkpoint.id}
          class="ui:bg-primary absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style:left="{checkpointPercent(checkpoint.timestampSeconds, knownDuration)}%"
          style:box-shadow="0 0 0 2px var(--background)"
          aria-label={formatCheckpointTimestamp(checkpoint.timestampSeconds)}
          onpointerdown={(event) => handleMarkerPointerDown(event, checkpoint)}
          onpointermove={(event) =>
            handleMarkerPointerMove(event, event.currentTarget.parentElement as HTMLElement, checkpoint)}
          onpointerup={(event) =>
            handleMarkerPointerUp(event, event.currentTarget.parentElement as HTMLElement, checkpoint)}
          onclick={(event) => {
            event.stopPropagation();
            seekTo(checkpoint.timestampSeconds);
          }}
        ></button>
      {/each}
    </div>
  {/if}

  {#if checkpoints.length === 0}
    <p class="ui:text-muted-foreground text-sm">
      {$t(`${T}.empty`)}
    </p>
  {:else}
    <ul class="divide-border divide-y rounded-md border">
      {#each checkpoints as checkpoint (checkpoint.id)}
        <li class="flex flex-wrap items-center gap-3 px-3 py-3">
          <time class="ui:text-muted-foreground w-12 shrink-0 text-sm tabular-nums">
            {formatCheckpointTimestamp(checkpoint.timestampSeconds)}
          </time>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">
              {checkpoint.question.title || $t(`${T}.untitled`)}
            </p>
            <div class="mt-1 flex flex-wrap gap-1.5">
              <Badge variant="secondary">{typeLabel(checkpoint)}</Badge>
              <Badge variant="outline">{resumeLabel(checkpoint)}</Badge>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <IconButton
              type="button"
              variant="secondary"
              size="icon-sm"
              tooltip={$t(`${T}.edit`)}
              disabled={$isFreePlan}
              onclick={() => openEdit(checkpoint)}
            >
              <PencilIcon />
            </IconButton>
            <IconButton
              type="button"
              variant="secondary"
              size="icon-sm"
              tooltip={$t(`${T}.delete`)}
              onclick={() => requestRemove(checkpoint)}
            >
              <Trash2Icon />
            </IconButton>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

{#if editorOpen}
  <CheckpointEditorSheet
    {courseId}
    {lessonId}
    {assetId}
    {playheadSeconds}
    durationSeconds={knownDuration}
    checkpoint={activeCheckpoint}
    onClose={handleEditorClose}
  />
{/if}

{#if resultsOpen}
  <CheckpointResultsSheet {courseId} {lessonId} onClose={() => (resultsOpen = false)} />
{/if}

<DeleteModal bind:open={openDeleteModal} onDelete={confirmRemove} />
