<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getTextareaCharacterLimits,
    sanitizeTextareaCharacterLimit,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { NumberField } from '../../../number-field';
  import { Textarea } from '../../../../base/textarea';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const characterLimits = $derived(getTextareaCharacterLimits(question));

  function patchQuestion(partial: Partial<ExerciseQuestionModel>) {
    onQuestionChange({ ...question, ...partial });
  }

  function patchSettings(next: Record<string, unknown>) {
    patchQuestion({ settings: { ...(question.settings ?? {}), ...next } });
  }
</script>

<div class="ui:space-y-3">
  <Textarea class="ui:w-full" rows={4} disabled={true} placeholder={label('textarea.edit.placeholder')} />

  <div class="ui:grid ui:gap-3 ui:md:grid-cols-2">
    <div class="ui:space-y-1">
      <p class="ui:text-sm ui:font-medium">{label('textarea.edit.min_characters_label')}</p>
      <NumberField
        integer
        min={0}
        value={characterLimits.minCharacters ?? null}
        isDisabled={disabled}
        allowEmpty
        placeholder={label('textarea.edit.min_characters_placeholder')}
        onValueChange={(next) => patchSettings({ minCharacters: next ?? undefined })}
      />
    </div>

    <div class="ui:space-y-1">
      <p class="ui:text-sm ui:font-medium">{label('textarea.edit.max_characters_label')}</p>
      <NumberField
        integer
        min={0}
        value={sanitizeTextareaCharacterLimit(question.settings?.maxCharacters) ?? null}
        isDisabled={disabled}
        allowEmpty
        placeholder={label('textarea.edit.max_characters_placeholder')}
        onValueChange={(next) => patchSettings({ maxCharacters: next ?? undefined })}
      />
    </div>
  </div>
</div>
