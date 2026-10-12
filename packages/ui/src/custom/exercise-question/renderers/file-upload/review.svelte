<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';

  import { DocumentCard } from '../../../document-card';
  import { formatUploadedFileSubtitle } from '../file-upload-types';

  let { answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const uploadedFile = $derived.by(() => {
    if (answer?.type !== 'FILE_UPLOAD') return null;

    const fileName = answer.fileName?.trim() || answer.fileKey?.trim() || '';
    if (!fileName) return null;

    return {
      fileName,
      fileUrl: answer.fileUrl?.trim() || null,
      mimeType: answer.mimeType,
      size: answer.size
    };
  });

  const subtitle = $derived(uploadedFile ? formatUploadedFileSubtitle(uploadedFile.mimeType, uploadedFile.size) : '');
</script>

{#if !uploadedFile}
  <p class="ui:text-muted-foreground ui:text-sm">{label('file_upload.review.empty', 'No file was submitted.')}</p>
{:else}
  <div class="ui:space-y-2">
    <DocumentCard
      title={uploadedFile.fileName}
      {subtitle}
      fileUrl={uploadedFile.fileUrl}
      viewLabel={label('file_upload.take.view', 'View')}
      downloadLabel={label('file_upload.take.download', 'Download')}
    />
    {#if !uploadedFile.fileUrl}
      <p class="ui:text-muted-foreground ui:text-sm">
        {label('file_upload.review.unavailable', 'This file cannot be opened.')}
      </p>
    {/if}
  </div>
{/if}
