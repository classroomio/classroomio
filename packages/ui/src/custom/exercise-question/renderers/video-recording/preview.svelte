<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getVideoRecordingMaxDurationSeconds,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { formatSeconds } from './format';

  let { question, labels }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);
  const maxDurationSeconds = $derived(getVideoRecordingMaxDurationSeconds(question.settings));
</script>

<div class="ui:space-y-2">
  <p class="ui:text-muted-foreground ui:text-sm">
    {label('video_recording.preview.max_duration_label', 'Max duration')}: {formatSeconds(maxDurationSeconds)}
  </p>
  <p class="ui:text-muted-foreground ui:text-sm">
    {label(
      'video_recording.preview.manual_grading',
      'Learners record a short video response. Manual grading required.'
    )}
  </p>
</div>
