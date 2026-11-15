<script lang="ts">
  import { getMathQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { MathInput } from '../../../math-input';
  import { MathImagePopover } from '../../../math-text';
  import { readAllowImageInput, readMathKeyboardPreset } from '../math/math-question-utils';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const latex = $derived(answer?.type === 'MATH_EXPRESSION' ? answer.latex : '');
  const keyboard = $derived(readMathKeyboardPreset(question.settings));
</script>

<div class="ui:flex ui:flex-wrap ui:items-center ui:gap-2">
  <MathInput
    class="ui:w-full ui:max-w-xl"
    value={latex}
    {keyboard}
    {disabled}
    placeholder={getMathQuestionLabel(labels, 'math.take.placeholder')}
    ariaLabel={getMathQuestionLabel(labels, 'math.take.sr_label')}
    onInput={(next) => onAnswerChange(next.latex.trim() ? { type: 'MATH_EXPRESSION', latex: next.latex } : null)}
  />
  {#if readAllowImageInput(question.settings)}
    <MathImagePopover
      {keyboard}
      {disabled}
      onInsert={(converted) => onAnswerChange({ type: 'MATH_EXPRESSION', latex: converted })}
    />
  {/if}
</div>
