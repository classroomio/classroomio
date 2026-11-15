<script lang="ts">
  import {
    getMathQuestionLabel,
    readMathExpressionSettings,
    type ExerciseQuestionLabels,
    type MathCompare,
    type MathQuestionLabelKey,
    type MathRequiredForm
  } from '@cio/question-types';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '../../../../base/button';
  import { Checkbox } from '../../../../base/checkbox';
  import { Input } from '../../../../base/input';
  import { Label } from '../../../../base/label';
  import * as Select from '../../../../base/select';
  import { IconButton } from '../../../icon-button';
  import { MathInput } from '../../../math-input';
  import { NumberField } from '../../../number-field';
  import MathTryAnswer from './math-try-answer.svelte';
  import {
    MATH_COMPARE_MODES,
    MATH_KEYBOARD_PRESET_KEYS,
    MATH_REQUIRED_FORMS,
    changeCompareMode,
    readAllowImageInput,
    readMathKeyboardPreset
  } from './math-question-utils';

  interface Props {
    settings: Record<string, unknown> | undefined;
    labels?: ExerciseQuestionLabels;
    disabled?: boolean;
    onPatchSettings: (patch: Record<string, unknown>) => void;
  }

  let { settings, labels, disabled = false, onPatchSettings }: Props = $props();

  const label = (key: MathQuestionLabelKey) => getMathQuestionLabel(labels, key);

  const parsed = $derived(readMathExpressionSettings(settings));
  const acceptedAnswers = $derived(parsed.acceptedAnswers.length > 0 ? parsed.acceptedAnswers : ['']);
  const keyboard = $derived(readMathKeyboardPreset(settings));
  const allowImageInput = $derived(readAllowImageInput(settings));
  const compare = $derived(parsed.compare);
  const feedbackRows = $derived(parsed.wrongAnswerFeedback);
  const variablesText = $derived(parsed.variables.join(', '));

  function setAcceptedAnswers(next: string[]) {
    onPatchSettings({ acceptedAnswers: next });
  }

  function setCompare(next: MathCompare) {
    onPatchSettings({ compare: next });
  }

  function setNumericTolerance(
    field: 'absoluteTolerance' | 'relativeTolerance' | 'significantFigures',
    value: number | null
  ) {
    if (compare.mode !== 'numeric') return;

    setCompare({ ...compare, [field]: value ?? undefined });
  }

  function setFeedback(index: number, patch: Partial<{ answer: string; feedback: string }>) {
    const next = feedbackRows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));
    onPatchSettings({ wrongAnswerFeedback: next });
  }

  function addFeedbackRow() {
    onPatchSettings({ wrongAnswerFeedback: [...feedbackRows, { answer: '', feedback: '' }] });
  }

  function setVariables(text: string) {
    const variables = text
      .split(',')
      .map((variable) => variable.trim())
      .filter(Boolean);
    onPatchSettings({ variables });
  }

  function setUnit(unit: string) {
    if (!unit.trim()) {
      onPatchSettings({ units: undefined });
      return;
    }

    onPatchSettings({ units: { unit, allowConversion: parsed.units?.allowConversion ?? false } });
  }
</script>

<div class="ui:space-y-4">
  <div class="ui:space-y-2">
    <Label>{label('math.edit.accepted_answers_label')}</Label>
    <p class="ui:text-muted-foreground ui:text-xs">{label('math.edit.accepted_answers_helper')}</p>
    {#each acceptedAnswers as acceptedAnswer, answerIndex (answerIndex)}
      <div class="ui:flex ui:items-center ui:gap-2">
        <MathInput
          class="ui:flex-1"
          {keyboard}
          {disabled}
          value={acceptedAnswer}
          placeholder={label('math.edit.answer_placeholder')}
          ariaLabel={label('math.edit.accepted_answers_label')}
          onInput={({ latex }) =>
            setAcceptedAnswers(acceptedAnswers.map((value, index) => (index === answerIndex ? latex : value)))}
        />
        {#if acceptedAnswers.length > 1}
          <IconButton
            type="button"
            variant="secondary"
            {disabled}
            tooltip={label('math.edit.remove')}
            onclick={() => setAcceptedAnswers(acceptedAnswers.filter((_, index) => index !== answerIndex))}
          >
            <XIcon class="ui:size-4" />
          </IconButton>
        {/if}
      </div>
    {/each}
    <Button
      type="button"
      variant="ghost"
      size="sm"
      {disabled}
      onclick={() => setAcceptedAnswers([...acceptedAnswers, ''])}
    >
      <PlusIcon class="ui:mr-1 ui:size-4" />
      {label('math.edit.add_answer')}
    </Button>
  </div>

  <div class="ui:grid ui:gap-3 ui:md:grid-cols-2">
    <div class="ui:space-y-1">
      <Label>{label('math.edit.compare_label')}</Label>
      <Select.Root
        type="single"
        value={compare.mode}
        {disabled}
        onValueChange={(mode) => mode && setCompare(changeCompareMode(compare, mode as MathCompare['mode']))}
      >
        <Select.Trigger class="ui:w-full">{label(`math.edit.compare.${compare.mode}`)}</Select.Trigger>
        <Select.Content>
          {#each MATH_COMPARE_MODES as mode (mode)}
            <Select.Item value={mode} label={label(`math.edit.compare.${mode}`)}>
              {label(`math.edit.compare.${mode}`)}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      <p class="ui:text-muted-foreground ui:text-xs">{label(`math.edit.compare.${compare.mode}_hint`)}</p>
    </div>

    <div class="ui:space-y-1">
      <Label>{label('math.edit.keyboard_label')}</Label>
      <Select.Root
        type="single"
        value={keyboard}
        {disabled}
        onValueChange={(preset) => preset && onPatchSettings({ keyboard: preset })}
      >
        <Select.Trigger class="ui:w-full">{label(`math.edit.keyboard.${keyboard}`)}</Select.Trigger>
        <Select.Content>
          {#each MATH_KEYBOARD_PRESET_KEYS as preset (preset)}
            <Select.Item value={preset} label={label(`math.edit.keyboard.${preset}`)}>
              {label(`math.edit.keyboard.${preset}`)}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  </div>

  {#if compare.mode === 'exact_form'}
    <div class="ui:space-y-1">
      <Label>{label('math.edit.form_label')}</Label>
      <Select.Root
        type="single"
        value={compare.form}
        {disabled}
        onValueChange={(form) => form && setCompare({ mode: 'exact_form', form: form as MathRequiredForm })}
      >
        <Select.Trigger class="ui:w-full ui:md:w-1/2">{label(`math.edit.form.${compare.form}`)}</Select.Trigger>
        <Select.Content>
          {#each MATH_REQUIRED_FORMS as form (form)}
            <Select.Item value={form} label={label(`math.edit.form.${form}`)}>
              {label(`math.edit.form.${form}`)}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  {/if}

  {#if compare.mode === 'numeric'}
    <div class="ui:grid ui:gap-3 ui:md:grid-cols-3">
      <div class="ui:space-y-1">
        <Label>{label('math.edit.absolute_tolerance_label')}</Label>
        <NumberField
          allowEmpty
          min={0}
          isDisabled={disabled}
          value={compare.absoluteTolerance ?? null}
          onValueChange={(value) => setNumericTolerance('absoluteTolerance', value)}
        />
      </div>
      <div class="ui:space-y-1">
        <Label>{label('math.edit.relative_tolerance_label')}</Label>
        <NumberField
          allowEmpty
          min={0}
          isDisabled={disabled}
          value={compare.relativeTolerance ?? null}
          onValueChange={(value) => setNumericTolerance('relativeTolerance', value)}
        />
      </div>
      <div class="ui:space-y-1">
        <Label>{label('math.edit.significant_figures_label')}</Label>
        <NumberField
          allowEmpty
          integer
          min={1}
          max={15}
          isDisabled={disabled}
          value={compare.significantFigures ?? null}
          onValueChange={(value) => setNumericTolerance('significantFigures', value)}
        />
      </div>
    </div>
  {/if}

  <div class="ui:flex ui:items-start ui:gap-2">
    <Checkbox
      {disabled}
      checked={allowImageInput}
      onCheckedChange={(checked) => onPatchSettings({ allowImageInput: checked === true })}
    />
    <div class="ui:space-y-1">
      <Label>{label('math.edit.allow_image_label')}</Label>
      <p class="ui:text-muted-foreground ui:text-xs">{label('math.edit.allow_image_helper')}</p>
    </div>
  </div>

  <div class="ui:grid ui:gap-3 ui:md:grid-cols-2">
    <div class="ui:space-y-1">
      <Label>{label('math.edit.units_label')}</Label>
      <Input
        {disabled}
        value={parsed.units?.unit ?? ''}
        placeholder={label('math.edit.units_placeholder')}
        oninput={(event) => setUnit(event.currentTarget.value)}
      />
      {#if parsed.units}
        <div class="ui:flex ui:items-center ui:gap-2">
          <Checkbox
            {disabled}
            checked={parsed.units.allowConversion}
            onCheckedChange={(checked) =>
              onPatchSettings({ units: { unit: parsed.units?.unit ?? '', allowConversion: checked === true } })}
          />
          <span class="ui:text-xs">{label('math.edit.units_allow_conversion')}</span>
        </div>
      {/if}
    </div>
    <div class="ui:space-y-1">
      <Label>{label('math.edit.variables_label')}</Label>
      <Input
        {disabled}
        value={variablesText}
        placeholder={label('math.edit.variables_placeholder')}
        oninput={(event) => setVariables(event.currentTarget.value)}
      />
      <p class="ui:text-muted-foreground ui:text-xs">{label('math.edit.variables_helper')}</p>
    </div>
  </div>

  <div class="ui:space-y-2">
    <Label>{label('math.edit.feedback_label')}</Label>
    <p class="ui:text-muted-foreground ui:text-xs">{label('math.edit.feedback_helper')}</p>
    {#each feedbackRows as row, rowIndex (rowIndex)}
      <div class="ui:flex ui:flex-col ui:gap-2 ui:md:flex-row ui:md:items-center">
        <MathInput
          class="ui:md:w-1/3"
          {keyboard}
          {disabled}
          value={row.answer}
          placeholder={label('math.edit.feedback_answer_placeholder')}
          ariaLabel={label('math.edit.feedback_answer_placeholder')}
          onInput={({ latex }) => setFeedback(rowIndex, { answer: latex })}
        />
        <Input
          class="ui:flex-1"
          {disabled}
          value={row.feedback}
          placeholder={label('math.edit.feedback_text_placeholder')}
          oninput={(event) => setFeedback(rowIndex, { feedback: event.currentTarget.value })}
        />
        <IconButton
          type="button"
          variant="secondary"
          {disabled}
          tooltip={label('math.edit.remove')}
          onclick={() =>
            onPatchSettings({ wrongAnswerFeedback: feedbackRows.filter((_, index) => index !== rowIndex) })}
        >
          <XIcon class="ui:size-4" />
        </IconButton>
      </div>
    {/each}
    <Button type="button" variant="ghost" size="sm" {disabled} onclick={addFeedbackRow}>
      <PlusIcon class="ui:mr-1 ui:size-4" />
      {label('math.edit.add_feedback')}
    </Button>
  </div>

  <MathTryAnswer settings={parsed} {keyboard} {labels} />
</div>
