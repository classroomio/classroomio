<script lang="ts">
  import {
    getMathQuestionLabel,
    type ExerciseQuestionLabels,
    type ExerciseQuestionImageUploader,
    type MathQuestionLabelKey,
    type WorkedSolutionFile,
    type WorkedSolutionWorkingInput
  } from '@cio/question-types';
  import ImagePlusIcon from '@lucide/svelte/icons/image-plus';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '../../../../base/button';
  import { Label } from '../../../../base/label';
  import { DrawingCanvas } from '../../../drawing-canvas';
  import { IconButton } from '../../../icon-button';
  import { MathInput, type MathKeyboardPreset } from '../../../math-input';

  interface Props {
    inputs: WorkedSolutionWorkingInput[];
    lines: string[];
    files: WorkedSolutionFile[];
    keyboard: MathKeyboardPreset;
    labels?: ExerciseQuestionLabels;
    disabled?: boolean;
    onImageUpload?: ExerciseQuestionImageUploader;
    onChange: (working: { lines: string[]; files: WorkedSolutionFile[] }) => void;
  }

  let { inputs, lines, files, keyboard, labels, disabled = false, onImageUpload, onChange }: Props = $props();

  const label = (key: MathQuestionLabelKey) => getMathQuestionLabel(labels, key);

  let photoInput = $state<HTMLInputElement | null>(null);
  let isUploading = $state(false);
  let uploadError = $state(false);

  const lineValues = $derived(lines.length > 0 ? lines : ['']);

  function setLines(next: string[]) {
    onChange({ lines: next, files });
  }

  async function addFile(kind: WorkedSolutionFile['kind'], file: File) {
    if (!onImageUpload) {
      uploadError = true;
      return;
    }

    uploadError = false;
    isUploading = true;
    try {
      const fileUrl = await onImageUpload(file);
      onChange({ lines, files: [...files, { kind, fileKey: fileUrl, fileName: file.name, fileUrl }] });
    } catch {
      uploadError = true;
    } finally {
      isUploading = false;
    }
  }

  async function handlePhotoSelected(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const selected = input.files?.[0];
    input.value = '';
    if (selected) await addFile('photo', selected);
  }
</script>

<div class="ui:space-y-4">
  {#if inputs.includes('typed')}
    <div class="ui:space-y-2">
      <Label>{label('math.worked.take.working_label')}</Label>
      {#each lineValues as line, lineIndex (lineIndex)}
        <div class="ui:flex ui:items-center ui:gap-2">
          <MathInput
            class="ui:flex-1"
            {keyboard}
            {disabled}
            value={line}
            placeholder={label('math.worked.take.line_placeholder')}
            ariaLabel={label('math.worked.take.working_label')}
            onInput={({ latex }) => setLines(lineValues.map((value, index) => (index === lineIndex ? latex : value)))}
          />
          {#if lineValues.length > 1}
            <IconButton
              type="button"
              {disabled}
              tooltip={label('math.worked.take.remove_line')}
              onclick={() => setLines(lineValues.filter((_, index) => index !== lineIndex))}
            >
              <XIcon class="ui:size-4" />
            </IconButton>
          {/if}
        </div>
      {/each}
      <Button type="button" variant="ghost" size="sm" {disabled} onclick={() => setLines([...lineValues, ''])}>
        <PlusIcon class="ui:mr-1 ui:size-4" />
        {label('math.worked.take.add_line')}
      </Button>
    </div>
  {/if}

  {#if inputs.includes('drawing')}
    <div class="ui:space-y-2">
      <Label>{label('math.worked.take.draw_label')}</Label>
      <DrawingCanvas
        {disabled}
        labels={{
          canvas: label('math.worked.take.draw_canvas'),
          undo: label('math.worked.take.draw_undo'),
          clear: label('math.worked.take.draw_clear'),
          save: label('math.worked.take.draw_save'),
          saving: label('math.worked.take.draw_saving')
        }}
        onSave={(file) => addFile('drawing', file)}
      />
    </div>
  {/if}

  {#if inputs.includes('photo')}
    <div class="ui:space-y-2">
      <input
        bind:this={photoInput}
        type="file"
        accept="image/*"
        capture="environment"
        class="ui:hidden"
        {disabled}
        onchange={handlePhotoSelected}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isUploading}
        onclick={() => photoInput?.click()}
      >
        <ImagePlusIcon class="ui:mr-1 ui:size-4" />
        {isUploading ? label('math.worked.take.uploading') : label('math.worked.take.upload_photo')}
      </Button>
    </div>
  {/if}

  {#if uploadError}
    <p class="ui:text-destructive ui:text-xs">{label('math.worked.take.upload_failed')}</p>
  {/if}

  {#if files.length > 0}
    <div class="ui:flex ui:flex-wrap ui:gap-3">
      {#each files as file, fileIndex (`${file.fileKey}-${fileIndex}`)}
        <div class="ui:group ui:relative ui:h-32 ui:w-32 ui:rounded-md ui:border">
          <img
            src={file.fileUrl ?? file.fileKey}
            alt={label(file.kind === 'drawing' ? 'math.worked.take.drawing_alt' : 'math.worked.take.photo_alt')}
            class="ui:h-full ui:w-full ui:rounded-md ui:object-cover"
          />
          <IconButton
            type="button"
            size="icon-sm"
            {disabled}
            tooltipClass="ui:absolute ui:right-[-12px] ui:top-[-12px] ui:z-10"
            tooltip={label('math.worked.take.remove_file')}
            onclick={() => onChange({ lines, files: files.filter((_, index) => index !== fileIndex) })}
          >
            <XIcon />
          </IconButton>
        </div>
      {/each}
    </div>
  {/if}
</div>
