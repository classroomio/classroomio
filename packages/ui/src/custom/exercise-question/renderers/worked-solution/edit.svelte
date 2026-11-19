<script lang="ts">
  import {
    getMathQuestionLabel,
    readWorkedSolutionSettings,
    type ExerciseQuestionRendererProps,
    type MathQuestionLabelKey,
    type WorkedSolutionWorkingInput
  } from '@cio/question-types';
  import { Checkbox } from '../../../../base/checkbox';
  import { Label } from '../../../../base/label';
  import { NumberField } from '../../../number-field';
  import MathSettingsFields from '../math/math-settings-fields.svelte';
  import RubricSection from '../math/rubric-section.svelte';
  import VariablesSection from '../math/variables-section.svelte';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();

  const label = (key: MathQuestionLabelKey) => getMathQuestionLabel(labels, key);
  const WORKING_INPUTS: readonly WorkedSolutionWorkingInput[] = ['typed', 'drawing', 'photo'];

  const questionPoints = $derived(Number(question.points ?? 0));
  const settings = $derived(readWorkedSolutionSettings(question.settings, questionPoints));
  const workingPoints = $derived(Math.round((questionPoints - settings.answerPoints) * 100) / 100);

  function patchSettings(patch: Record<string, unknown>) {
    onQuestionChange({ ...question, settings: { ...(question.settings ?? {}), ...patch } });
  }

  function toggleWorkingInput(input: WorkedSolutionWorkingInput, isChecked: boolean) {
    const next = WORKING_INPUTS.filter((candidate) =>
      candidate === input ? isChecked : settings.workingInputs.includes(candidate)
    );
    if (next.length === 0) return;

    patchSettings({ workingInputs: next });
  }
</script>

<div class="ui:space-y-4">
  <MathSettingsFields settings={question.settings} {labels} {disabled} onPatchSettings={patchSettings}>
    {#snippet more()}
      <VariablesSection {question} {labels} {disabled} onPatchSettings={patchSettings} />

      <div class="ui:grid ui:gap-3 ui:md:grid-cols-2">
        <div class="ui:space-y-1">
          <Label>{label('math.worked.edit.answer_points_label')}</Label>
          <NumberField
            min={0}
            max={questionPoints}
            isDisabled={disabled}
            value={settings.answerPoints}
            onValueChange={(next) => patchSettings({ answerPoints: next ?? 0 })}
          />
        </div>
        <div class="ui:space-y-1">
          <Label>{label('math.worked.edit.working_points_label')}</Label>
          <p class="ui:text-sm ui:font-medium" data-testid="worked-working-points">{workingPoints}</p>
        </div>
      </div>

      <div class="ui:space-y-2">
        <Label>{label('math.worked.edit.working_inputs_label')}</Label>
        <div class="ui:flex ui:flex-wrap ui:gap-4">
          {#each WORKING_INPUTS as input (input)}
            <div class="ui:flex ui:items-center ui:gap-2">
              <Checkbox
                {disabled}
                checked={settings.workingInputs.includes(input)}
                onCheckedChange={(checked) => toggleWorkingInput(input, checked === true)}
              />
              <span class="ui:text-sm">{label(`math.worked.input.${input}`)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/snippet}
  </MathSettingsFields>

  <RubricSection settings={question.settings} {workingPoints} {labels} {disabled} onPatchSettings={patchSettings} />
</div>
