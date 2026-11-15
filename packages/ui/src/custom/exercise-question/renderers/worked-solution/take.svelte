<script lang="ts">
  import {
    getMathQuestionLabel,
    readWorkedSolutionSettings,
    type ExerciseQuestionRendererProps,
    type WorkedSolutionFile
  } from '@cio/question-types';
  import { Label } from '../../../../base/label';
  import { MathInput } from '../../../math-input';
  import { MathImagePopover } from '../../../math-text';
  import { readAllowImageInput, readMathKeyboardPreset } from '../math/math-question-utils';
  import WorkingInput from './working-input.svelte';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {},
    onImageUpload
  }: ExerciseQuestionRendererProps = $props();

  const settings = $derived(readWorkedSolutionSettings(question.settings, Number(question.points ?? 0)));
  const keyboard = $derived(readMathKeyboardPreset(question.settings));
  const current = $derived(answer?.type === 'WORKED_SOLUTION' ? answer : null);
  const latex = $derived(current?.latex ?? '');
  const lines = $derived(current?.working.lines ?? []);
  const files = $derived(current?.working.files ?? []);

  function emit(next: { latex: string; lines: string[]; files: WorkedSolutionFile[] }) {
    const nextLines = next.lines.filter((line) => line.trim());
    const isEmpty = !next.latex.trim() && nextLines.length === 0 && next.files.length === 0;

    onAnswerChange(
      isEmpty ? null : { type: 'WORKED_SOLUTION', latex: next.latex, working: { lines: next.lines, files: next.files } }
    );
  }
</script>

<div class="ui:space-y-4">
  <div class="ui:space-y-2">
    <Label>{getMathQuestionLabel(labels, 'math.worked.take.answer_label')}</Label>
    <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-2">
      <MathInput
        class="ui:w-full ui:max-w-xl"
        value={latex}
        {keyboard}
        {disabled}
        placeholder={getMathQuestionLabel(labels, 'math.take.placeholder')}
        ariaLabel={getMathQuestionLabel(labels, 'math.worked.take.answer_label')}
        onInput={(next) => emit({ latex: next.latex, lines, files })}
      />
      {#if readAllowImageInput(question.settings)}
        <MathImagePopover {keyboard} {disabled} onInsert={(converted) => emit({ latex: converted, lines, files })} />
      {/if}
    </div>
  </div>

  <WorkingInput
    inputs={settings.workingInputs}
    {lines}
    {files}
    {keyboard}
    {labels}
    {disabled}
    {onImageUpload}
    onChange={(working) => emit({ latex, lines: working.lines, files: working.files })}
  />
</div>
