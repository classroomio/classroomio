<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getTextareaCharacterLimits,
    sanitizeTextareaCharacterLimit,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { Input } from '../../../../base/input';
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

  function updateCharacterLimit(settingKey: 'minCharacters' | 'maxCharacters', value: string) {
    const parsedValue = value === '' ? undefined : sanitizeTextareaCharacterLimit(value);

    if (parsedValue === undefined) {
      patchSettings({ [settingKey]: undefined });
      return;
    }

    patchSettings({ [settingKey]: parsedValue });
  }
</script>

<div class="ui:space-y-3">
  <Textarea class="ui:w-full" rows={4} disabled={true} placeholder={label('textarea.edit.placeholder')} />

  <div class="ui:grid ui:gap-3 ui:md:grid-cols-2">
    <div class="ui:space-y-1">
      <p class="ui:text-sm ui:font-medium">{label('textarea.edit.min_characters_label')}</p>
      <Input
        type="number"
        min="0"
        step="1"
        value={characterLimits.minCharacters === undefined ? '' : String(characterLimits.minCharacters)}
        {disabled}
        placeholder={label('textarea.edit.min_characters_placeholder')}
        onchange={(event) => updateCharacterLimit('minCharacters', event.currentTarget.value)}
      />
    </div>

    <div class="ui:space-y-1">
      <p class="ui:text-sm ui:font-medium">{label('textarea.edit.max_characters_label')}</p>
      <Input
        type="number"
        min="0"
        step="1"
        value={characterLimits.maxCharacters === undefined ? '' : String(characterLimits.maxCharacters)}
        {disabled}
        placeholder={label('textarea.edit.max_characters_placeholder')}
        onchange={(event) => updateCharacterLimit('maxCharacters', event.currentTarget.value)}
      />
    </div>
  </div>
</div>
