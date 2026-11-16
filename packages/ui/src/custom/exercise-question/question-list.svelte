<script lang="ts">
  import type { Snippet } from 'svelte';
  import type {
    AnswerData,
    ExerciseQuestionListRenderContract,
    ExerciseQuestionModel,
    ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { getExerciseQuestionContractKey } from '@cio/question-types';
  import { cn } from '../../tools';
  import QuestionRenderer from './question-renderer.svelte';

  interface Props {
    contract: ExerciseQuestionListRenderContract;
    onAnswerChange?: (question: ExerciseQuestionModel, answer: AnswerData | null) => void;
    onQuestionChange?: (question: ExerciseQuestionModel, updatedQuestion: ExerciseQuestionModel) => void;
    itemClass?: string;
    showContainer?: boolean;
    pluginRenderer?: Snippet<[ExerciseQuestionRendererProps]>;
  }

  let {
    contract,
    onAnswerChange = () => {},
    onQuestionChange = () => {},
    itemClass = '',
    showContainer = true,
    pluginRenderer
  }: Props = $props();
</script>

{#each contract.questions as question, index (getExerciseQuestionContractKey(question, index))}
  {@const questionKey = getExerciseQuestionContractKey(question, index)}
  <div id={`question-${questionKey}`} class={cn('ui:scroll-mt-24', itemClass)}>
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
      {pluginRenderer}
    />
  </div>
{/each}
