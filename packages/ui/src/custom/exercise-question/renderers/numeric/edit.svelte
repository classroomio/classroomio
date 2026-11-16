<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getMathQuestionLabel,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import CircleQuestionMarkIcon from '@lucide/svelte/icons/circle-question-mark';
  import { NumberField } from '../../../number-field';
  import { IconButton } from '../../../icon-button';
  import { MathInput } from '../../../math-input';
  import VariablesSection from '../math/variables-section.svelte';
  import { correctValueToLatex, latexToCorrectValue } from './numeric-utils';

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
      <MathInput
        value={correctValueToLatex(question.settings?.correctValue as number | string | undefined)}
        keyboard="numeric"
        {disabled}
        placeholder={label('numeric.edit.correct_value_placeholder')}
        ariaLabel={label('numeric.edit.correct_value_label')}
        onInput={(next) => patchSettings({ correctValue: latexToCorrectValue(next.latex) })}
      />
      <p class="ui:text-muted-foreground ui:text-xs">
        {getMathQuestionLabel(labels, 'math.numeric.correct_value_hint')}
      </p>
    </div>

    <div class="ui:space-y-1">
      <div class="ui:flex ui:items-center ui:gap-1">
        <p class="ui:text-sm ui:font-medium">{label('numeric.edit.tolerance_label')}</p>
        <IconButton type="button" class="ui:h-6 ui:w-6" {disabled} tooltip={label('numeric.edit.tolerance_info')}>
          <CircleQuestionMarkIcon class="ui:size-3.5" />
          <span class="ui:sr-only">{label('numeric.edit.tolerance_info')}</span>
        </IconButton>
      </div>
      <NumberField
        placeholder={label('numeric.edit.tolerance_placeholder')}
        value={(question.settings?.tolerance as number | undefined) ?? null}
        isDisabled={disabled}
        allowEmpty
        onValueChange={(next) => patchSettings({ tolerance: next ?? undefined })}
      />
    </div>
  </div>

  <div class="ui:grid ui:gap-3 ui:md:grid-cols-2">
    <div class="ui:space-y-1">
      <p class="ui:text-sm ui:font-medium">{getMathQuestionLabel(labels, 'math.edit.relative_tolerance_label')}</p>
      <NumberField
        value={(question.settings?.relativeTolerance as number | undefined) ?? null}
        isDisabled={disabled}
        allowEmpty
        onValueChange={(next) => patchSettings({ relativeTolerance: next ?? undefined })}
      />
    </div>

    <div class="ui:space-y-1">
      <p class="ui:text-sm ui:font-medium">{getMathQuestionLabel(labels, 'math.edit.significant_figures_label')}</p>
      <NumberField
        integer
        min={1}
        value={(question.settings?.significantFigures as number | undefined) ?? null}
        isDisabled={disabled}
        allowEmpty
        onValueChange={(next) => patchSettings({ significantFigures: next ?? undefined })}
      />
    </div>
  </div>

  <VariablesSection {question} {labels} {disabled} onPatchSettings={patchSettings} />
</div>
