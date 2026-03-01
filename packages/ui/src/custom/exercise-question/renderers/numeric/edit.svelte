<script lang="ts">
  import {
    getExerciseQuestionLabel,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import CircleQuestionMarkIcon from '@lucide/svelte/icons/circle-question-mark';
  import { Input } from '../../../../base/input';
  import { IconButton } from '../../../icon-button';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  function patchQuestion(partial: Partial<ExerciseQuestionModel>) {
    onQuestionChange({ ...question, ...partial });
  }

  function patchSettings(next: Record<string, unknown>) {
    patchQuestion({ settings: { ...(question.settings ?? {}), ...next } });
  }
</script>

<div class="ui:space-y-3">
  <div class="ui:grid ui:gap-3 ui:md:grid-cols-2">
    <div class="ui:space-y-1">
      <div class="ui:flex ui:items-center ui:gap-1">
        <p class="ui:text-sm ui:font-medium">{label('numeric.edit.correct_value_label')}</p>
        <IconButton type="button" class="ui:h-6 ui:w-6" {disabled} tooltip={label('numeric.edit.correct_value_info')}>
          <CircleQuestionMarkIcon class="ui:size-3.5" />
          <span class="ui:sr-only">{label('numeric.edit.correct_value_info')}</span>
        </IconButton>
      </div>
      <Input
        type="number"
        placeholder={label('numeric.edit.correct_value_placeholder')}
        value={String((question.settings?.correctValue as number | undefined) ?? '')}
        {disabled}
        onchange={(event) => patchSettings({ correctValue: Number(event.currentTarget.value) })}
      />
    </div>

    <div class="ui:space-y-1">
      <div class="ui:flex ui:items-center ui:gap-1">
        <p class="ui:text-sm ui:font-medium">{label('numeric.edit.tolerance_label')}</p>
        <IconButton type="button" class="ui:h-6 ui:w-6" {disabled} tooltip={label('numeric.edit.tolerance_info')}>
          <CircleQuestionMarkIcon class="ui:size-3.5" />
          <span class="ui:sr-only">{label('numeric.edit.tolerance_info')}</span>
        </IconButton>
      </div>
      <Input
        type="number"
        placeholder={label('numeric.edit.tolerance_placeholder')}
        value={String((question.settings?.tolerance as number | undefined) ?? '')}
        {disabled}
        onchange={(event) => patchSettings({ tolerance: Number(event.currentTarget.value) })}
      />
    </div>
  </div>
</div>
