<script lang="ts">
  import { getMathQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { MathInput } from '../../../math-input';
  import { readMathKeyboardPreset } from '../math/math-question-utils';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const latex = $derived(answer?.type === 'MATH_EXPRESSION' ? answer.latex : '');
</script>

<MathInput
  class="ui:w-full ui:max-w-xl"
  value={latex}
  keyboard={readMathKeyboardPreset(question.settings)}
  {disabled}
  placeholder={getMathQuestionLabel(labels, 'math.take.placeholder')}
  ariaLabel={getMathQuestionLabel(labels, 'math.take.sr_label')}
  onInput={(next) => onAnswerChange(next.latex.trim() ? { type: 'MATH_EXPRESSION', latex: next.latex } : null)}
/>
