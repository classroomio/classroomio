<script lang="ts">
  import {
    VIDEO_RECORDING_DEFAULT_MAX_DURATION_SECONDS,
    VIDEO_RECORDING_PLATFORM_MAX_DURATION_SECONDS,
    getExerciseQuestionLabel,
    getVideoRecordingMaxDurationSeconds,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { Badge } from '../../../../base/badge';
  import { Input } from '../../../../base/input';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);
  const maxDurationValue = $derived(String(getVideoRecordingMaxDurationSeconds(question.settings)));

  function patchQuestion(partial: Partial<ExerciseQuestionModel>) {
    onQuestionChange({ ...question, ...partial });
  }

  function patchSettings(next: Record<string, unknown>) {
    patchQuestion({ settings: { ...(question.settings ?? {}), ...next, allowRetakes: true } });
  }

  function onDurationChange(value: string) {
    const duration = Number(value);
    if (!Number.isFinite(duration) || duration <= 0) {
      patchSettings({ maxDurationSeconds: VIDEO_RECORDING_DEFAULT_MAX_DURATION_SECONDS });
      return;
    }

    patchSettings({
      maxDurationSeconds: Math.min(Math.round(duration), VIDEO_RECORDING_PLATFORM_MAX_DURATION_SECONDS)
    });
  }
</script>

<div class="ui:space-y-3">
  <div class="ui:grid ui:gap-3 ui:md:grid-cols-[minmax(0,220px)_1fr] ui:md:items-start">
    <div class="ui:space-y-1">
      <p class="ui:text-sm ui:font-medium">
        {label('video_recording.edit.max_duration_label', 'Max duration')}
      </p>
      <Input
        type="number"
        min="1"
        max={VIDEO_RECORDING_PLATFORM_MAX_DURATION_SECONDS}
        step="1"
        value={maxDurationValue}
        placeholder={label('video_recording.edit.max_duration_placeholder', '60')}
        {disabled}
        onchange={(event) => onDurationChange(event.currentTarget.value)}
      />
    </div>

    <div class="ui:space-y-2 ui:pt-1">
      <Badge variant="secondary">{label('video_recording.edit.manual_grading', 'Requires manual grading')}</Badge>
      <p class="ui:text-muted-foreground ui:text-sm">
        {label(
          'video_recording.edit.max_duration_helper',
          'Students record in the browser and can retake before submitting.'
        )}
      </p>
    </div>
  </div>
</div>
