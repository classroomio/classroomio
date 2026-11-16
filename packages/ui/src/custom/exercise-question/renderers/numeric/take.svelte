<script lang="ts">
  import { getMathQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { untrack } from 'svelte';
  import { MathInput } from '../../../math-input';
  import { latexToNumber } from './numeric-utils';

  let { answer = null, disabled = false, labels, onAnswerChange = () => {} }: ExerciseQuestionRendererProps = $props();

  let draftLatex = $state(untrack(() => (answer?.type === 'NUMERIC' ? (answer.latex ?? String(answer.value)) : '')));

  async function handleInput(nextLatex: string) {
    draftLatex = nextLatex;
    const value = await latexToNumber(nextLatex);
    if (draftLatex !== nextLatex) return;

    if (value === null) {
      onAnswerChange(null);
      return;
    }

    onAnswerChange({ type: 'NUMERIC', value, latex: nextLatex.trim() });
  }
</script>

<MathInput
  class="ui:w-full ui:max-w-xs"
  value={draftLatex}
  keyboard="numeric"
  {disabled}
  placeholder={getMathQuestionLabel(labels, 'math.take.placeholder')}
  ariaLabel={getMathQuestionLabel(labels, 'math.take.sr_label')}
  onInput={(next) => handleInput(next.latex)}
/>
