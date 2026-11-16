<script lang="ts">
  import {
    getMathQuestionLabel,
    QUESTION_TYPE_IDS,
    readQuestionParameters,
    VARIABLE_TYPES,
    type ExerciseQuestionLabels,
    type ExerciseQuestionModel,
    type MathQuestionLabelKey,
    type QuestionVariable,
    type VariableType
  } from '@cio/question-types';
  import type { VariantPreview } from '@cio/question-types/variant-preview';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '../../../../base/button';
  import { Checkbox } from '../../../../base/checkbox';
  import { Input } from '../../../../base/input';
  import { Label } from '../../../../base/label';
  import * as Select from '../../../../base/select';
  import { Textarea } from '../../../../base/textarea';
  import { IconButton } from '../../../icon-button';
  import { MathText, mathPlanGate } from '../../../math-text';
  import { NumberField } from '../../../number-field';
  import { loadVariantPreview } from './math-question-utils';

  interface Props {
    question: ExerciseQuestionModel;
    labels?: ExerciseQuestionLabels;
    disabled?: boolean;
    onPatchSettings: (patch: Record<string, unknown>) => void;
  }

  let { question, labels, disabled = false, onPatchSettings }: Props = $props();

  const label = (key: MathQuestionLabelKey) => getMathQuestionLabel(labels, key);

  const parameters = $derived(readQuestionParameters(question.settings));
  const rawParameters = $derived((question.settings?.parameters ?? {}) as Record<string, unknown>);
  const constraintsText = $derived((parameters?.constraints ?? []).join('\n'));

  let previews = $state<VariantPreview[] | null>(null);
  let isPreviewing = $state(false);

  function patchParameters(patch: Record<string, unknown>) {
    previews = null;
    onPatchSettings({ parameters: { ...rawParameters, ...patch } });
  }

  function nextVariableName(): string {
    const taken = new Set((parameters?.variables ?? []).map((variable) => variable.name));

    return 'abcdfghjklmnpqrstuvwxyz'.split('').find((letter) => !taken.has(letter)) ?? 'z';
  }

  function enable() {
    onPatchSettings({
      parameters: {
        variables: [{ name: 'a', type: 'int', min: 2, max: 9, step: 1 }],
        constraints: [],
        answerFormula: ''
      }
    });
  }

  function disable() {
    previews = null;
    onPatchSettings({ parameters: undefined });
  }

  function setVariable(index: number, patch: Partial<QuestionVariable>) {
    const next = (parameters?.variables ?? []).map((variable, variableIndex) =>
      variableIndex === index ? { ...variable, ...patch } : variable
    );
    patchParameters({ variables: next });
  }

  function addVariable() {
    patchParameters({
      variables: [...(parameters?.variables ?? []), { name: nextVariableName(), type: 'int', min: 1, max: 10, step: 1 }]
    });
  }

  function setChoices(index: number, text: string) {
    const choices = text
      .split(',')
      .map((entry) => Number(entry.trim()))
      .filter((entry) => entry.toString().length > 0 && Number.isFinite(entry));
    setVariable(index, { choices });
  }

  function useComputedAnswer() {
    const isNumeric = question.questionType === 'NUMERIC';
    onPatchSettings(isNumeric ? { correctValue: '{{answer}}' } : { acceptedAnswers: ['{{answer}}'] });
  }

  async function runPreview() {
    isPreviewing = true;
    try {
      const { previewVariants } = await loadVariantPreview();
      previews = previewVariants({
        questionTypeId: QUESTION_TYPE_IDS[question.questionType],
        title: question.title,
        points: question.points,
        settings: question.settings,
        optionLabels: question.options?.map((option) => option.label),
        options: question.options
      });
    } finally {
      isPreviewing = false;
    }
  }

  function describeValues(values: Record<string, number>): string {
    return Object.entries(values)
      .map(([name, value]) => name + ' = ' + value)
      .join(', ');
  }
</script>

<div class="ui:space-y-3 ui:rounded-md ui:border ui:p-3" data-testid="variables-section">
  <div class="ui:flex ui:items-start ui:justify-between ui:gap-2">
    <div class="ui:space-y-1">
      <Label>{label('math.variables.heading')}</Label>
      <p class="ui:text-muted-foreground ui:text-xs">
        {label('math.variables.helper')}
        <code class="ui:rounded ui:bg-muted ui:px-1">{'{{a}}'}</code>
      </p>
    </div>
    {#if parameters}
      <Button type="button" variant="ghost" size="sm" {disabled} onclick={disable}>
        {label('math.variables.disable')}
      </Button>
    {/if}
  </div>

  {#if !parameters && $mathPlanGate.locked}
    <Button type="button" variant="outline" size="sm" onclick={$mathPlanGate.onUpgrade} data-testid="variables-upgrade">
      {label('math.upgrade.required')}
    </Button>
  {:else if !parameters}
    <Button type="button" variant="outline" size="sm" {disabled} onclick={enable}>
      <PlusIcon class="ui:mr-1 ui:size-4" />
      {label('math.variables.enable')}
    </Button>
  {:else}
    <div class="ui:space-y-2">
      {#each parameters.variables as variable, variableIndex (variableIndex)}
        <div class="ui:flex ui:flex-wrap ui:items-end ui:gap-2" data-testid="variable-row">
          <div class="ui:w-16 ui:space-y-1">
            <Label class="ui:text-xs">{label('math.variables.name_label')}</Label>
            <Input
              value={variable.name}
              maxlength={1}
              {disabled}
              aria-label={label('math.variables.name_label')}
              oninput={(event) => setVariable(variableIndex, { name: event.currentTarget.value.trim() })}
            />
          </div>
          <div class="ui:w-36 ui:space-y-1">
            <Label class="ui:text-xs">{label('math.variables.type_label')}</Label>
            <Select.Root
              type="single"
              value={variable.type}
              {disabled}
              onValueChange={(type) => type && setVariable(variableIndex, { type: type as VariableType })}
            >
              <Select.Trigger class="ui:w-full"
                >{label(('math.variables.type.' + variable.type) as MathQuestionLabelKey)}</Select.Trigger
              >
              <Select.Content>
                {#each VARIABLE_TYPES as type (type)}
                  <Select.Item value={type} label={label(('math.variables.type.' + type) as MathQuestionLabelKey)}>
                    {label(('math.variables.type.' + type) as MathQuestionLabelKey)}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
          {#if variable.type === 'choice'}
            <div class="ui:min-w-40 ui:flex-1 ui:space-y-1">
              <Label class="ui:text-xs">{label('math.variables.choices_label')}</Label>
              <Input
                value={variable.choices.join(', ')}
                placeholder={label('math.variables.choices_placeholder')}
                {disabled}
                aria-label={label('math.variables.choices_label')}
                onchange={(event) => setChoices(variableIndex, event.currentTarget.value)}
              />
            </div>
          {:else}
            <div class="ui:w-24">
              <NumberField
                label={label('math.variables.min_label')}
                value={variable.min}
                isDisabled={disabled}
                onValueChange={(min) => min !== null && setVariable(variableIndex, { min })}
              />
            </div>
            <div class="ui:w-24">
              <NumberField
                label={label('math.variables.max_label')}
                value={variable.max}
                isDisabled={disabled}
                onValueChange={(max) => max !== null && setVariable(variableIndex, { max })}
              />
            </div>
            <div class="ui:w-24">
              <NumberField
                label={label('math.variables.step_label')}
                value={variable.step}
                min={0.0001}
                isDisabled={disabled}
                onValueChange={(step) => step !== null && setVariable(variableIndex, { step })}
              />
            </div>
          {/if}
          {#if parameters.variables.length > 1}
            <IconButton
              type="button"
              variant="secondary"
              {disabled}
              tooltip={label('math.variables.remove')}
              onclick={() =>
                patchParameters({ variables: parameters.variables.filter((_, index) => index !== variableIndex) })}
            >
              <XIcon class="ui:size-4" />
            </IconButton>
          {/if}
        </div>
      {/each}
      <Button type="button" variant="ghost" size="sm" {disabled} onclick={addVariable}>
        <PlusIcon class="ui:mr-1 ui:size-4" />
        {label('math.variables.add')}
      </Button>
    </div>

    <div class="ui:space-y-1">
      <Label>{label('math.variables.constraints_label')}</Label>
      <p class="ui:text-muted-foreground ui:text-xs">{label('math.variables.constraints_helper')}</p>
      <Textarea
        value={constraintsText}
        rows={2}
        {disabled}
        placeholder={label('math.variables.constraints_placeholder')}
        aria-label={label('math.variables.constraints_label')}
        onchange={(event) =>
          patchParameters({
            constraints: event.currentTarget.value
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
          })}
      />
    </div>

    <div class="ui:space-y-1">
      <Label>{label('math.variables.answer_formula_label')}</Label>
      <p class="ui:text-muted-foreground ui:text-xs">
        {label('math.variables.answer_formula_helper')}
        <code class="ui:rounded ui:bg-muted ui:px-1">{'{{answer}}'}</code>
      </p>
      <Input
        value={parameters.answerFormula}
        {disabled}
        placeholder={label('math.variables.answer_formula_placeholder')}
        aria-label={label('math.variables.answer_formula_label')}
        onchange={(event) => patchParameters({ answerFormula: event.currentTarget.value.trim() })}
      />
      <div class="ui:flex ui:flex-wrap ui:gap-x-4 ui:gap-y-1 ui:pt-1">
        <Label class="ui:flex ui:items-center ui:gap-2 ui:text-sm ui:font-normal">
          <Checkbox
            checked={parameters.requireIntegerAnswer}
            {disabled}
            onCheckedChange={(checked) => patchParameters({ requireIntegerAnswer: checked === true })}
          />
          {label('math.variables.integer_answer')}
        </Label>
        <Label class="ui:flex ui:items-center ui:gap-2 ui:text-sm ui:font-normal">
          <Checkbox
            checked={parameters.requireNonzeroAnswer}
            {disabled}
            onCheckedChange={(checked) => patchParameters({ requireNonzeroAnswer: checked === true })}
          />
          {label('math.variables.nonzero_answer')}
        </Label>
      </div>
      {#if parameters.answerFormula}
        <Button type="button" variant="ghost" size="sm" {disabled} onclick={useComputedAnswer}>
          {label('math.variables.use_answer')}
        </Button>
      {/if}
    </div>

    <div class="ui:space-y-2">
      <Button type="button" variant="outline" size="sm" {disabled} loading={isPreviewing} onclick={runPreview}>
        {isPreviewing ? label('math.variables.previewing') : label('math.variables.preview')}
      </Button>
      {#if previews}
        <ul class="ui:space-y-2" data-testid="variant-previews">
          {#each previews as preview (preview.seed)}
            <li
              class="ui:flex ui:flex-col ui:gap-1 ui:rounded-md ui:border ui:p-2 ui:text-sm"
              data-testid="variant-preview"
              data-ok={preview.issues.length === 0}
            >
              <div class="ui:flex ui:items-center ui:gap-2">
                {#if preview.issues.length === 0}
                  <CircleCheckIcon
                    class="ui:text-success ui:size-4 ui:shrink-0"
                    aria-label={label('math.variables.preview_ok')}
                  />
                {:else}
                  <TriangleAlertIcon
                    class="ui:text-destructive ui:size-4 ui:shrink-0"
                    aria-label={label('math.variables.preview_problem')}
                  />
                {/if}
                <span class="ui:text-muted-foreground ui:text-xs">{describeValues(preview.values)}</span>
              </div>
              <MathText text={preview.title} />
              {#if preview.answer}
                <p class="ui:text-xs">
                  <span class="ui:text-muted-foreground">{label('math.variables.preview_answer')}:</span>
                  <MathText text={'$' + preview.answer + '$'} />
                </p>
              {/if}
              {#each preview.issues as issue (issue)}
                <p class="ui:text-destructive ui:text-xs">{issue}</p>
              {/each}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>
