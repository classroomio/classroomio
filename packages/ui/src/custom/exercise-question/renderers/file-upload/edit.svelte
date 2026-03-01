<script lang="ts">
  import {
    getExerciseQuestionLabel,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { Button } from '../../../../base/button';
  import { Checkbox } from '../../../../base/checkbox';
  import { Input } from '../../../../base/input';
  import * as Popover from '../../../../base/popover';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import {
    FILE_UPLOAD_SUPPORTED_TYPES,
    formatAcceptedFileTypes,
    normalizeAcceptedFileTypes
  } from '../file-upload-types';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);
  const acceptedTypes = $derived(normalizeAcceptedFileTypes(question.settings?.acceptedTypes));
  const acceptedTypesDisplay = $derived(
    acceptedTypes.length > 0
      ? formatAcceptedFileTypes(acceptedTypes)
      : label('file_upload.edit.accepted_types_placeholder')
  );

  function patchQuestion(partial: Partial<ExerciseQuestionModel>) {
    onQuestionChange({ ...question, ...partial });
  }

  function patchSettings(next: Record<string, unknown>) {
    patchQuestion({ settings: { ...(question.settings ?? {}), ...next } });
  }

  function toggleAcceptedType(typeValue: string, checked: boolean) {
    const nextAcceptedTypes = checked
      ? [...acceptedTypes, typeValue]
      : acceptedTypes.filter((acceptedType) => acceptedType !== typeValue);

    patchSettings({ acceptedTypes: nextAcceptedTypes });
  }

  const rawMaxSize = $derived(question.settings?.maxSizeMb as number | undefined);
  const maxSizeMb = $derived(
    typeof rawMaxSize === 'number' && !Number.isNaN(rawMaxSize) && rawMaxSize >= 0
      ? String(Math.min(rawMaxSize, 2))
      : ''
  );

  $effect(() => {
    const raw = question.settings?.maxSizeMb as number | undefined;
    if (typeof raw === 'number' && raw > 2) {
      patchSettings({ maxSizeMb: 2 });
    }
  });

  function onMaxSizeChange(value: string) {
    const num = Number(value);
    if (value === '' || Number.isNaN(num)) {
      patchSettings({ maxSizeMb: undefined });
      return;
    }
    patchSettings({ maxSizeMb: Math.min(2, Math.max(0, num)) });
  }
</script>

<div class="ui:space-y-3">
  <div class="ui:grid ui:gap-3 ui:md:grid-cols-2">
    <div class="ui:space-y-1">
      <p class="ui:text-sm ui:font-medium">{label('file_upload.preview.accepted_types_label')}</p>
      <Popover.Root>
        <Popover.Trigger {disabled} class="ui:w-full">
          <Button
            type="button"
            variant="outline"
            class="ui:w-full ui:justify-between ui:text-left ui:font-normal"
            {disabled}
          >
            <span class="ui:truncate">{acceptedTypesDisplay}</span>
            <ChevronDownIcon class="ui:ml-2 ui:size-4 ui:shrink-0 ui:opacity-50" aria-hidden="true" />
          </Button>
        </Popover.Trigger>
        <Popover.Content align="start" class="ui:max-h-72 ui:w-88 ui:p-2">
          <div class="ui:flex ui:max-h-64 ui:flex-col ui:gap-0 ui:overflow-y-auto">
            {#each FILE_UPLOAD_SUPPORTED_TYPES as fileType (fileType.value)}
              <label
                class="ui:flex ui:cursor-pointer ui:select-none ui:items-center ui:gap-2 ui:rounded-sm ui:px-2 ui:py-2 ui:text-sm hover:ui:bg-accent hover:ui:text-accent-foreground {disabled
                  ? 'ui:pointer-events-none ui:opacity-50'
                  : ''}"
              >
                <Checkbox
                  checked={acceptedTypes.includes(fileType.value)}
                  {disabled}
                  onCheckedChange={(checked) => toggleAcceptedType(fileType.value, checked === true)}
                />
                <span>{fileType.label}</span>
              </label>
            {/each}
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>

    <div class="ui:space-y-1">
      <p class="ui:text-sm ui:font-medium">{label('file_upload.preview.max_size_label')}</p>
      <Input
        type="number"
        min="0"
        max="2"
        step="0.1"
        placeholder={label('file_upload.edit.max_size_placeholder')}
        value={maxSizeMb}
        {disabled}
        onchange={(event) => onMaxSizeChange(event.currentTarget.value)}
      />
    </div>
  </div>
</div>
