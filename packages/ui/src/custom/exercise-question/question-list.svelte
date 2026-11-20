<script lang="ts">
  import type { AnswerData, ExerciseQuestionListRenderContract, ExerciseQuestionModel } from '@cio/question-types';
  import { getExerciseQuestionContractKey, getMultiPartStemIds } from '@cio/question-types';
  import { cn } from '../../tools';
  import MultiPartQuestion from './multi-part-question.svelte';
  import QuestionRenderer from './question-renderer.svelte';

  interface Props {
    contract: ExerciseQuestionListRenderContract;
    onAnswerChange?: (question: ExerciseQuestionModel, answer: AnswerData | null) => void;
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

  const stemIds = $derived(getMultiPartStemIds(contract.questions));
  const topLevelQuestions = $derived(contract.questions.filter((question) => question.parentQuestionId == null));

  function getParts(stem: ExerciseQuestionModel) {
    return contract.questions.filter((question) => String(question.parentQuestionId ?? '') === String(stem.id));
  }
</script>

{#each topLevelQuestions as question, index (getExerciseQuestionContractKey(question, index))}
  {@const questionKey = getExerciseQuestionContractKey(question, index)}
  <div id={`question-${questionKey}`} class={cn('ui:scroll-mt-24', itemClass)}>
    {#if stemIds.has(Number(question.id))}
      <MultiPartQuestion
        stem={question}
        parts={getParts(question)}
        {contract}
        questionNumber={index + 1}
        {onAnswerChange}
        {showContainer}
      />
    {:else}
      <QuestionRenderer
        contract={{
          mode: contract.mode,
          question,
          answer: contract.answersByKey?.[questionKey],
          submissions: contract.submissions,
          maxSubmissionItems: contract.maxSubmissionItems,
          disabled: contract.disabled,
          labels: contract.labels,
          platformMaxFileSizeMb: contract.platformMaxFileSizeMb,
          onImageUpload: contract.onImageUpload,
          onFileUpload: contract.onFileUpload,
          onVideoRecordingUpload: contract.onVideoRecordingUpload
        }}
        onAnswerChange={(answer) => onAnswerChange(question, answer)}
        onQuestionChange={(updatedQuestion) => onQuestionChange(question, updatedQuestion)}
        questionNumber={index + 1}
        questionNumberActive={false}
        {showContainer}
      />
    {/if}
  </div>
{/each}
