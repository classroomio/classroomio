<script lang="ts">
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { QUESTION_TYPES } from '$features/ui/question/constants';
  import { getExerciseEditorQuestionTypeLabel } from '$features/course/components/exercise/question-type-utils';
  import { lessonVideoBus } from './lesson-video-bus.svelte';
  import { lessonVideoCheckpointStore } from './checkpoint-store.svelte';
  import type { LessonVideoCheckpoint } from './checkpoint-types';
  import { checkpointPercent, findCheckpointCollision, formatCheckpointTimestamp } from './checkpoint-utils';
  import CheckpointEditorDialog from './checkpoint-editor-dialog.svelte';
  import CheckpointResponsesDialog from './checkpoint-responses-dialog.svelte';

  interface Props {
    courseId: string;
    lessonId: string;
    assetId: string;
    durationSeconds: number;
  }

  let { courseId, lessonId, assetId, durationSeconds }: Props = $props();

  let editorOpen = $state(false);
  let responsesOpen = $state(false);
  let activeCheckpoint = $state<LessonVideoCheckpoint | null>(null);
  let draggingId = $state<string | null>(null);

  const checkpoints = $derived(lessonVideoCheckpointStore.listForAsset(lessonId, assetId));
  const playheadSeconds = $derived(lessonVideoBus.currentTimeSeconds);
  const knownDuration = $derived(durationSeconds || lessonVideoBus.durationSeconds || 0);
  const playheadPercent = $derived(checkpointPercent(playheadSeconds, knownDuration));
  const canAdd = $derived(knownDuration > 0);

  function typeLabel(checkpoint: LessonVideoCheckpoint): string {
    const typeEntry = QUESTION_TYPES.find((entry) => entry.key === checkpoint.question.questionType);

    return getExerciseEditorQuestionTypeLabel(typeEntry);
  }

  function resumeLabel(checkpoint: LessonVideoCheckpoint): string {
    return checkpoint.resumePolicy === 'correct'
      ? t.get('course.navItem.lessons.materials.tabs.video.checkpoints.resume_correct')
      : t.get('course.navItem.lessons.materials.tabs.video.checkpoints.resume_any');
  }

  function responseCount(checkpoint: LessonVideoCheckpoint): number {
    return lessonVideoCheckpointStore.answersForCheckpoint(checkpoint.id).length;
  }

  function openAdd() {
    activeCheckpoint = null;
    editorOpen = true;
  }

  function openEdit(checkpoint: LessonVideoCheckpoint) {
    activeCheckpoint = checkpoint;
    editorOpen = true;
  }

  function openResponses(checkpoint: LessonVideoCheckpoint) {
    activeCheckpoint = checkpoint;
    responsesOpen = true;
  }

  function handleEditorOpenChange(isOpen: boolean) {
    editorOpen = isOpen;

    if (!isOpen) {
      activeCheckpoint = null;
    }
  }

  function handleResponsesOpenChange(isOpen: boolean) {
    responsesOpen = isOpen;

    if (!isOpen) {
      activeCheckpoint = null;
    }
  }

  function seekTo(seconds: number) {
    lessonVideoBus.seek(seconds);
  }

  function removeCheckpoint(checkpoint: LessonVideoCheckpoint) {
    lessonVideoCheckpointStore.remove(checkpoint.id);
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

  function handleMarkerPointerDown(event: PointerEvent, checkpoint: LessonVideoCheckpoint) {
    event.preventDefault();
    event.stopPropagation();
    draggingId = checkpoint.id;
    seekTo(checkpoint.timestampSeconds);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function handleMarkerPointerMove(event: PointerEvent, rail: HTMLElement, checkpoint: LessonVideoCheckpoint) {
    if (draggingId !== checkpoint.id || !knownDuration) return;

    const nextSeconds = secondsFromRail(event.clientX, rail);
    seekTo(nextSeconds);
  }

  function handleMarkerPointerUp(event: PointerEvent, rail: HTMLElement, checkpoint: LessonVideoCheckpoint) {
    if (draggingId !== checkpoint.id) return;

    draggingId = null;
    const nextSeconds = secondsFromRail(event.clientX, rail);
    const collision = findCheckpointCollision(checkpoints, nextSeconds, checkpoint.id);
    if (collision) {
      snackbar.error('snackbar.lesson_video.checkpoint_collision');
      seekTo(checkpoint.timestampSeconds);
      return;
    }

    lessonVideoCheckpointStore.upsert({ ...checkpoint, timestampSeconds: nextSeconds });
    seekTo(nextSeconds);
  }
</script>

<div class="mt-6 space-y-4">
  <div class="flex items-start justify-between gap-4">
    <div>
      <p class="font-semibold">{$t('course.navItem.lessons.materials.tabs.video.checkpoints.heading')}</p>
      <p class="ui:text-muted-foreground mt-1 text-sm">
        {$t('course.navItem.lessons.materials.tabs.video.checkpoints.subheading')}
      </p>
    </div>
    <Button
      type="button"
      variant="secondary"
      testId="video-checkpoint-add-question"
      disabled={!canAdd}
      onclick={openAdd}
    >
      {$t('course.navItem.lessons.materials.tabs.video.checkpoints.add_at', {
        time: formatCheckpointTimestamp(playheadSeconds)
      })}
    </Button>
  </div>

  {#if knownDuration > 0}
    <div
      class="ui:bg-muted relative h-2 cursor-pointer rounded-full"
      role="slider"
      tabindex="0"
      aria-valuemin={0}
      aria-valuemax={Math.floor(knownDuration)}
      aria-valuenow={Math.floor(playheadSeconds)}
      aria-label={$t('course.navItem.lessons.materials.tabs.video.checkpoints.timeline_label')}
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
      {$t('course.navItem.lessons.materials.tabs.video.checkpoints.empty')}
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
              {checkpoint.question.title || $t('course.navItem.lessons.materials.tabs.video.checkpoints.untitled')}
            </p>
            <div class="mt-1 flex flex-wrap gap-1.5">
              <Badge variant="secondary">{typeLabel(checkpoint)}</Badge>
              <Badge variant="outline">{resumeLabel(checkpoint)}</Badge>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              testId="video-checkpoint-responses"
              onclick={() => openResponses(checkpoint)}
            >
              {$t('course.navItem.lessons.materials.tabs.video.checkpoints.responses_count', {
                count: responseCount(checkpoint)
              })}
            </Button>
            <IconButton
              type="button"
              variant="secondary"
              size="icon-sm"
              tooltip={$t('course.navItem.lessons.materials.tabs.video.checkpoints.edit')}
              onclick={() => openEdit(checkpoint)}
            >
              <PencilIcon />
            </IconButton>
            <IconButton
              type="button"
              variant="secondary"
              size="icon-sm"
              tooltip={$t('course.navItem.lessons.materials.tabs.video.checkpoints.delete')}
              onclick={() => removeCheckpoint(checkpoint)}
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
  <CheckpointEditorDialog
    open={true}
    {lessonId}
    {assetId}
    {playheadSeconds}
    durationSeconds={knownDuration}
    checkpoint={activeCheckpoint}
    onOpenChange={handleEditorOpenChange}
  />
{/if}

{#if responsesOpen && activeCheckpoint}
  <CheckpointResponsesDialog
    open={true}
    {courseId}
    checkpoint={activeCheckpoint}
    onOpenChange={handleResponsesOpenChange}
  />
{/if}
