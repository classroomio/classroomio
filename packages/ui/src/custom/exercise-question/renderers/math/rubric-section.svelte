<script lang="ts">
  import {
    createVariantSeed,
    getMathQuestionLabel,
    getRubricMaxPoints,
    readMarkingRubric,
    roundPoints,
    type ExerciseQuestionLabels,
    type MathQuestionLabelKey
  } from '@cio/question-types';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '../../../../base/button';
  import { Input } from '../../../../base/input';
  import { Label } from '../../../../base/label';
  import { Switch } from '../../../../base/switch';
  import { IconButton } from '../../../icon-button';
  import { NumberField } from '../../../number-field';
  import { mathPlanGate } from '../../../math-text';

  interface Props {
    settings: Record<string, unknown> | undefined;
    /** Points the working is worth; the rubric steps should add up to it. */
    workingPoints: number;
    labels?: ExerciseQuestionLabels;
    disabled?: boolean;
    onPatchSettings: (patch: Record<string, unknown>) => void;
  }

  let { settings, workingPoints, labels, disabled = false, onPatchSettings }: Props = $props();

  const label = (key: MathQuestionLabelKey) => getMathQuestionLabel(labels, key);

  const rubric = $derived(readMarkingRubric(settings, { keepBlankSteps: true }));
  const total = $derived(getRubricMaxPoints(rubric));
  const isAiLocked = $derived($mathPlanGate.locked && settings?.aiGrading !== true);
  const isAiEnabled = $derived(settings?.aiGrading === true);
  const hasMismatch = $derived(rubric.steps.length > 0 && total !== roundPoints(workingPoints));

  function setSteps(steps: typeof rubric.steps) {
    onPatchSettings({ rubric: { steps } });
  }

  function patchStep(index: number, patch: Partial<(typeof rubric.steps)[number]>) {
    setSteps(rubric.steps.map((step, stepIndex) => (stepIndex === index ? { ...step, ...patch } : step)));
  }

  function addStep() {
    setSteps([...rubric.steps, { id: 'step-' + createVariantSeed(), description: '', points: 1 }]);
  }
</script>

<div class="ui:space-y-3 ui:rounded-md ui:border ui:p-3" data-testid="rubric-section">
  <div class="ui:space-y-1">
    <Label>{label('math.rubric.heading')}</Label>
    <p class="ui:text-muted-foreground ui:text-xs">{label('math.rubric.helper')}</p>
  </div>

  {#each rubric.steps as step, stepIndex (step.id)}
    <div class="ui:flex ui:items-end ui:gap-2" data-testid="rubric-step">
      <Input
        class="ui:flex-1"
        value={step.description}
        {disabled}
        placeholder={label('math.rubric.step_placeholder')}
        aria-label={label('math.rubric.step_placeholder')}
        oninput={(event) => patchStep(stepIndex, { description: event.currentTarget.value })}
      />
      <div class="ui:w-24">
        <NumberField
          value={step.points}
          min={0}
          isDisabled={disabled}
          onValueChange={(points) => points !== null && patchStep(stepIndex, { points })}
        />
      </div>
      <IconButton
        type="button"
        variant="secondary"
        {disabled}
        tooltip={label('math.rubric.remove_step')}
        onclick={() => setSteps(rubric.steps.filter((_, index) => index !== stepIndex))}
      >
        <XIcon class="ui:size-4" />
      </IconButton>
    </div>
  {/each}

  <div class="ui:flex ui:items-center ui:justify-between ui:gap-2">
    <Button type="button" variant="ghost" size="sm" {disabled} onclick={addStep}>
      <PlusIcon class="ui:mr-1 ui:size-4" />
      {label('math.rubric.add_step')}
    </Button>
    <p class="ui:text-sm" data-testid="rubric-total">{label('math.rubric.total')}: {total}</p>
  </div>
  {#if hasMismatch}
    <p class="ui:text-destructive ui:text-xs" data-testid="rubric-mismatch">{label('math.rubric.total_mismatch')}</p>
  {/if}

  <div class="ui:flex ui:items-start ui:gap-3 ui:border-t ui:pt-3">
    <Switch
      checked={isAiEnabled}
      disabled={disabled || rubric.steps.length === 0 || isAiLocked}
      aria-label={label('math.rubric.ai_label')}
      onCheckedChange={(checked) => onPatchSettings({ aiGrading: checked })}
    />
    <div class="ui:space-y-1">
      <Label>{label('math.rubric.ai_label')}</Label>
      <p class="ui:text-muted-foreground ui:text-xs">{label('math.rubric.ai_helper')}</p>
      {#if isAiLocked}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onclick={$mathPlanGate.onUpgrade}
          data-testid="ai-grading-upgrade"
        >
          {label('math.upgrade.required')}
        </Button>
      {/if}
    </div>
  </div>
</div>
