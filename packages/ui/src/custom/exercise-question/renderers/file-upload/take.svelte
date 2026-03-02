<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import { Button } from '../../../../base/button';
  import { isFileSizeAllowed, isFileTypeAllowed, normalizeAcceptedFileTypes } from '../file-upload-types';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  let fileInput = $state<HTMLInputElement | null>(null);
  const acceptedTypes = $derived(normalizeAcceptedFileTypes(question.settings?.acceptedTypes));
  const acceptAttribute = $derived(acceptedTypes.join(','));
  const maxSizeMb = $derived(question.settings?.maxSizeMb as number | undefined);

  const fileName = $derived(
    typeof answer === 'string' && answer.trim().length > 0 ? answer : answer instanceof File ? answer.name : ''
  );

  const fileUrl = $derived.by(() => {
    if (answer && typeof answer === 'object' && !Array.isArray(answer) && 'fileUrl' in answer) {
      const url = (answer as { fileUrl?: string }).fileUrl;
      return typeof url === 'string' && url.trim().length > 0 ? url : null;
    }
    return null;
  });

  function openFilePicker() {
    if (disabled) return;
    fileInput?.click();
  }

  function onFileSelected(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const selectedFile = input.files?.[0];
    input.value = '';

    if (!selectedFile) return;
    if (!isFileTypeAllowed(selectedFile, acceptedTypes)) return;
    if (!isFileSizeAllowed(selectedFile, maxSizeMb)) return;
    onAnswerChange(selectedFile.name);
  }
</script>

<div class="ui:space-y-2">
  <input
    bind:this={fileInput}
    type="file"
    accept={acceptAttribute || undefined}
    hidden
    class="ui:hidden"
    {disabled}
    onchange={onFileSelected}
  />
  <Button type="button" variant="outline" {disabled} onclick={openFilePicker}>
    <PlusIcon class="ui:size-4" />
    {label('file_upload.take.upload_button')}
  </Button>
  {#if fileName}
    <div class="ui:flex ui:items-center ui:gap-2">
      <p class="ui:text-muted-foreground ui:text-xs">{label('file_upload.take.selected_file_label')}: {fileName}</p>
      {#if disabled && fileUrl}
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={fileName}
          class="ui:inline-flex ui:items-center ui:gap-1 ui:text-xs ui:text-primary ui:underline ui:transition-opacity ui:hover:opacity-80"
        >
          <DownloadIcon class="ui:size-4" />
          {label('file_upload.take.download', 'Download')}
        </a>
      {/if}
    </div>
  {/if}
</div>
