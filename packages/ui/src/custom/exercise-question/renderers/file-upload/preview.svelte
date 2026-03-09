<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { formatAcceptedFileTypes, normalizeAcceptedFileTypes } from '../file-upload-types';

  let { question, labels }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);
  const acceptedTypes = $derived(normalizeAcceptedFileTypes(question.settings?.acceptedTypes));
  const acceptedTypesDisplay = $derived(
    acceptedTypes.length > 0 ? formatAcceptedFileTypes(acceptedTypes) : label('common.not_set')
  );
</script>

<div class="ui:space-y-1">
  <p class="ui:text-muted-foreground ui:text-sm">
    {label('file_upload.preview.accepted_types_label')}:
    {acceptedTypesDisplay}
  </p>
  <p class="ui:text-muted-foreground ui:text-sm">
    {label('file_upload.preview.max_size_label')}:
    {String((question.settings?.maxSizeMb as number | undefined) ?? 0)}
  </p>
</div>
