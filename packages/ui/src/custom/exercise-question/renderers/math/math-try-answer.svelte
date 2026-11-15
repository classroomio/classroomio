<script lang="ts">
  import {
    getMathQuestionLabel,
    type ExerciseQuestionLabels,
    type MathExpressionSettings,
    type MathGradeResult,
    type MathQuestionLabelKey
  } from '@cio/question-types';
  import { Button } from '../../../../base/button';
  import { Label } from '../../../../base/label';
  import { MathInput, type MathKeyboardPreset } from '../../../math-input';
  import MathGradeResultView from './math-grade-result.svelte';
  import { loadMathGrading } from './math-question-utils';

  interface Props {
    settings: MathExpressionSettings;
    keyboard?: MathKeyboardPreset;
    labels?: ExerciseQuestionLabels;
  }

  let { settings, keyboard = 'algebra', labels }: Props = $props();

  const label = (key: MathQuestionLabelKey) => getMathQuestionLabel(labels, key);

  let sampleLatex = $state('');
  let result = $state<MathGradeResult | null>(null);
  let isChecking = $state(false);
  let needsAnswer = $state(false);

  const hasAcceptedAnswer = $derived(settings.acceptedAnswers.some((answer) => answer.trim().length > 0));

  async function check() {
    if (!sampleLatex.trim()) return;

    needsAnswer = !hasAcceptedAnswer;
    if (needsAnswer) {
      result = null;
      return;
    }

    isChecking = true;
    try {
      const { scoreMathExpression } = await loadMathGrading();
      result = scoreMathExpression(settings, sampleLatex);
    } finally {
      isChecking = false;
    }
  }
</script>

<div class="ui:space-y-2 ui:rounded-md ui:border ui:border-dashed ui:p-3" data-testid="math-try-answer">
  <Label>{label('math.edit.try_label')}</Label>
  <p class="ui:text-muted-foreground ui:text-xs">{label('math.edit.try_helper')}</p>
  <div class="ui:flex ui:items-center ui:gap-2">
    <MathInput
      class="ui:flex-1"
      {keyboard}
      bind:value={sampleLatex}
      placeholder={label('math.edit.try_placeholder')}
      ariaLabel={label('math.edit.try_label')}
      onInput={() => (result = null)}
      onSubmit={check}
    />
    <Button type="button" variant="outline" size="sm" disabled={isChecking || !sampleLatex.trim()} onclick={check}>
      {isChecking ? label('math.edit.try_checking') : label('math.edit.try_button')}
    </Button>
  </div>
  {#if needsAnswer}
    <p class="ui:text-destructive ui:text-xs">{label('math.edit.try_needs_answer')}</p>
  {/if}
  {#if result}
    <MathGradeResultView
      reason={result.reason}
      requiredForm={result.requiredForm}
      feedback={result.feedback}
      misconception={result.misconception}
      matchedAnswer={result.matchedAnswer}
      {labels}
    />
  {/if}
</div>
