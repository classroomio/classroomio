<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { MediaPlayer } from '../../../media-player';
  import LabeledValueRow from '../shared/labeled-value-row.svelte';
  import { formatFileSize, formatSeconds } from './format';

  let { answer = null, labels }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const recording = $derived(answer?.type === 'VIDEO_RECORDING' ? answer : null);
  const playbackUrl = $derived.by(() => {
    if (!recording) return '';
    const enrichedUrl = (recording as { fileUrl?: string }).fileUrl;
    return recording.playbackUrl ?? enrichedUrl ?? '';
  });

  function formatDate(value: string | undefined): string {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString();
  }
</script>

{#if !recording}
  <p class="ui:text-muted-foreground ui:text-sm">
    {label('video_recording.submission.no_video', 'No video submitted.')}
  </p>
{:else}
  <div class="ui:space-y-3">
    {#if playbackUrl}
      <div class="ui:max-w-xl ui:overflow-hidden ui:rounded-md">
        <MediaPlayer
          source={{ type: 'upload', url: playbackUrl }}
          options={{ controls: true, playsinline: true, width: '100%', maxHeight: '360px' }}
        />
      </div>
    {:else}
      <p class="ui:text-muted-foreground ui:text-sm">
        {label('video_recording.submission.unavailable', 'Video unavailable.')}
      </p>
    {/if}

    <div class="ui:grid ui:gap-2 ui:text-sm ui:sm:grid-cols-2">
      <LabeledValueRow
        label={label('video_recording.submission.duration', 'Duration')}
        value={formatSeconds(recording.durationSeconds)}
      />
      <LabeledValueRow
        label={label('video_recording.submission.file_size', 'File size')}
        value={formatFileSize(recording.size)}
      />
      <LabeledValueRow
        label={label('video_recording.submission.recorded_at', 'Recorded')}
        value={formatDate(recording.recordedAt)}
      />
      <LabeledValueRow
        label={label('video_recording.submission.uploaded_at', 'Uploaded')}
        value={formatDate(recording.uploadedAt)}
      />
      <LabeledValueRow
        label={label('video_recording.submission.retake_count', 'Retakes')}
        value={String(recording.retakeCount ?? 0)}
      />
    </div>
  </div>
{/if}
