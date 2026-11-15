<script lang="ts">
  import { getMathQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { MathInput } from '../../../math-input';
  import { latexToNumber } from './numeric-utils';

  let { answer = null, disabled = false, labels, onAnswerChange = () => {} }: ExerciseQuestionRendererProps = $props();

  const latex = $derived(answer?.type === 'NUMERIC' ? (answer.latex ?? String(answer.value)) : '');

  function handleInput(nextLatex: string) {
    const value = latexToNumber(nextLatex);
    if (value === null) {
      onAnswerChange(null);
      return;
    }

    onAnswerChange({ type: 'NUMERIC', value, latex: nextLatex.trim() });
  }
</script>

<MathInput
  class="ui:w-full ui:max-w-xs"
  value={latex}
  keyboard="numeric"
  {disabled}
  placeholder={getMathQuestionLabel(labels, 'math.take.placeholder')}
  ariaLabel={getMathQuestionLabel(labels, 'math.take.sr_label')}
  onInput={(next) => handleInput(next.latex)}
/>
