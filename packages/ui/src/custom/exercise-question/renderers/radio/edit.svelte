<script lang="ts">
  import {
    getExerciseQuestionLabel,
    type ExerciseQuestionModel,
    type ExerciseQuestionOption,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import CheckIcon from '@lucide/svelte/icons/check';
  import CircleIcon from '@lucide/svelte/icons/circle';
  import { Button } from '../../../../base/button';
  import { Input } from '../../../../base/input';
  import { IconButton } from '../../../icon-button';
  import OptionImage from '../option-image.svelte';
  import { fileToDataUrl, getOptionImageUrl, mergeOptionSettings, removeOptionSetting } from '../option-image-utils';

  let {
    question,
    disabled = false,
    labels,
    onQuestionChange = () => {},
    onImageUpload
  }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  let optionImageInput = $state<HTMLInputElement | null>(null);
  let optionImageTargetIndex = $state<number | null>(null);
  let optionImageError = $state('');
  let isOptionImageUploading = $state(false);

  function patchQuestion(partial: Partial<ExerciseQuestionModel>) {
    onQuestionChange({ ...question, ...partial });
  }

  function updateOption(index: number, partial: Partial<ExerciseQuestionOption>) {
    const options = [...(question.options ?? [])];
    const option = options[index];
    if (!option) return;

    options[index] = { ...option, ...partial };
    patchQuestion({ options });
  }

  function setCorrectOption(index: number) {
    const options = [...(question.options ?? [])].map((option, optionIndex) => ({
      ...option,
      isCorrect: optionIndex === index
    }));
    patchQuestion({ options });
  }

  function addOption() {
    patchQuestion({
      options: [
        ...(question.options ?? []),
        {
          id: `${new Date().getTime()}-option`,
          label: '',
          value: '',
          isCorrect: false,
          settings: {}
        }
      ]
    });
  }

  function removeOption(index: number) {
    const options = [...(question.options ?? [])];
    options.splice(index, 1);
    patchQuestion({ options });
  }

  function openOptionImagePicker(index: number) {
    if (disabled || isOptionImageUploading) return;

    optionImageTargetIndex = index;
    optionImageInput?.click();
  }

  async function uploadOptionImage(file: File): Promise<string> {
    if (onImageUpload) {
      return onImageUpload(file);
    }

    return fileToDataUrl(file);
  }

  async function handleOptionImageSelection(event: Event) {
    const targetIndex = optionImageTargetIndex;
    optionImageTargetIndex = null;

    const input = event.currentTarget as HTMLInputElement;
    const selectedFile = input.files?.[0];
    input.value = '';

    if (targetIndex === null || targetIndex < 0 || !selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      optionImageError = label('question.edit.upload_error_only_images');
      return;
    }

    optionImageError = '';
    isOptionImageUploading = true;

    try {
      const imageUrl = await uploadOptionImage(selectedFile);
      if (!imageUrl) return;

      const options = [...(question.options ?? [])];
      const option = options[targetIndex];
      if (!option) return;

      options[targetIndex] = mergeOptionSettings(option, { imageUrl });
      patchQuestion({ options });
    } catch (error) {
      optionImageError = label('question.edit.upload_error_failed');
      console.error('Failed to upload option image:', error);
    } finally {
      isOptionImageUploading = false;
    }
  }

  function removeOptionImage(index: number) {
    const options = [...(question.options ?? [])];
    const option = options[index];
    if (!option) return;

    options[index] = removeOptionSetting(option, 'imageUrl');
    patchQuestion({ options });
    optionImageError = '';
  }
</script>

<div class="ui:space-y-3">
  <p class="ui:text-muted-foreground ui:text-xs">{label('radio.edit.helper')}</p>
  {#if optionImageError}
    <p class="ui:text-destructive ui:text-xs">{optionImageError}</p>
  {/if}

  <input
    bind:this={optionImageInput}
    type="file"
    accept="image/*"
    class="ui:hidden"
    disabled={disabled || isOptionImageUploading}
    onchange={handleOptionImageSelection}
  />

  <div class="ui:space-y-2">
    {#each question.options ?? [] as option, index}
      {@const optionImageUrl = getOptionImageUrl(option)}
      <div class="ui:flex ui:items-start ui:gap-2">
        <IconButton
          type="button"
          {disabled}
          tooltip={option.isCorrect === true
            ? label('radio.edit.correct_selected_tooltip')
            : label('radio.edit.mark_correct_tooltip')}
          class={option.isCorrect === true
            ? 'ui:text-primary ui:border-primary/30 ui:bg-primary/10'
            : 'ui:text-muted-foreground'}
          onclick={() => setCorrectOption(index)}
        >
          {#if option.isCorrect === true}
            <CheckIcon class="ui:size-4" />
          {:else}
            <CircleIcon class="ui:size-4" />
          {/if}
          <span class="ui:sr-only">{label('radio.edit.mark_correct_sr')}</span>
        </IconButton>

        <div class="ui:flex-1 ui:space-y-2">
          <Input
            class="ui:w-full"
            placeholder={[label('common.option_prefix'), String(index + 1)].filter(Boolean).join(' ').trim()}
            value={option.label}
            {disabled}
            onchange={(event) => updateOption(index, { label: event.currentTarget.value })}
          />

          <div class="ui:flex ui:flex-wrap ui:items-start ui:gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={disabled || isOptionImageUploading}
              onclick={() => openOptionImagePicker(index)}
            >
              <PlusIcon class="ui:size-4" />
              {label('question.edit.add_image')}
            </Button>

            {#if optionImageUrl}
              <OptionImage
                src={optionImageUrl}
                alt={label('question.edit.image_alt')}
                variant="edit"
                onRemove={() => removeOptionImage(index)}
                {disabled}
                removeTooltip={label('question.edit.remove_image_tooltip')}
                removeSr={label('question.edit.remove_image_sr')}
              />
            {/if}
          </div>
        </div>

        <IconButton
          type="button"
          {disabled}
          tooltip={label('common.remove')}
          class="ui:text-muted-foreground"
          onclick={() => removeOption(index)}
        >
          <Trash2Icon class="ui:size-4" />
          <span class="ui:sr-only">{label('common.remove')}</span>
        </IconButton>
      </div>
    {/each}
  </div>

  <Button variant="outline" type="button" {disabled} onclick={addOption}>{label('common.add_option')}</Button>
</div>
