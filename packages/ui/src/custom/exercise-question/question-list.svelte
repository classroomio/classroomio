<script lang="ts">
  import type { AnswerData, ExerciseQuestionListRenderContract, ExerciseQuestionModel } from '@cio/question-types';
  import { getExerciseQuestionContractKey } from '@cio/question-types';
  import QuestionRenderer from './question-renderer.svelte';

  interface Props {
    contract: ExerciseQuestionListRenderContract;
    onAnswerChange?: (question: ExerciseQuestionModel, answer: AnswerData) => void;
    onQuestionChange?: (question: ExerciseQuestionModel, updatedQuestion: ExerciseQuestionModel) => void;
    itemClass?: string;
    showContainer?: boolean;
  }

  let {
    contract,
    onAnswerChange = () => {},
    onQuestionChange = () => {},
    itemClass = '',
    showContainer = true
  }: Props = $props();
</script>

{#each contract.questions as question, index (getExerciseQuestionContractKey(question, index))}
  {@const questionKey = getExerciseQuestionContractKey(question, index)}
  <div class={itemClass}>
    <QuestionRenderer
      contract={{
        mode: contract.mode,
        question,
        answer: contract.answersByKey?.[questionKey],
        submissions: contract.submissions,
        maxSubmissionItems: contract.maxSubmissionItems,
        disabled: contract.disabled,
        labels: contract.labels,
        onImageUpload: contract.onImageUpload,
        onFileUpload: contract.onFileUpload
      }}
      onAnswerChange={(answer) => onAnswerChange(question, answer)}
      onQuestionChange={(updatedQuestion) => onQuestionChange(question, updatedQuestion)}
      {showContainer}
    />
  </div>
{/each}
