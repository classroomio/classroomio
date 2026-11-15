<script lang="ts">
  import type { AnswerData, ExerciseQuestionListRenderContract, ExerciseQuestionModel } from '@cio/question-types';
  import { getExerciseQuestionContractKey, getMathQuestionLabel, getPartLabel } from '@cio/question-types';
  import QuestionRenderer from './question-renderer.svelte';

  interface Props {
    stem: ExerciseQuestionModel;
    parts: ExerciseQuestionModel[];
    contract: ExerciseQuestionListRenderContract;
    questionNumber?: number;
    /** Shown beside the summed part score in review modes, such as "Parts". */
    scoreLabel?: string;
    onAnswerChange?: (question: ExerciseQuestionModel, answer: AnswerData | null) => void;
    showContainer?: boolean;
  }

  let {
    stem,
    parts,
    contract,
    questionNumber,
    scoreLabel = getMathQuestionLabel(contract.labels, 'math.parts.score'),
    onAnswerChange = () => {},
    showContainer = true
  }: Props = $props();

  const stemKey = $derived(getExerciseQuestionContractKey(stem));
  const scoresByKey = $derived(contract.scoresByKey);
  const partsEarned = $derived.by(() => {
    if (!scoresByKey) return null;

    const earned = parts.reduce((sum, part) => sum + (scoresByKey[getExerciseQuestionContractKey(part)] ?? 0), 0);

    return Math.round(earned * 100) / 100;
  });
  const partsTotal = $derived(Math.round(parts.reduce((sum, part) => sum + Number(part.points ?? 0), 0) * 100) / 100);

  function getContract(question: ExerciseQuestionModel) {
    return {
      mode: contract.mode,
      question,
      answer: contract.answersByKey?.[getExerciseQuestionContractKey(question)],
      submissions: contract.submissions,
      maxSubmissionItems: contract.maxSubmissionItems,
      disabled: contract.disabled,
      labels: contract.labels,
      platformMaxFileSizeMb: contract.platformMaxFileSizeMb,
      onImageUpload: contract.onImageUpload,
      onFileUpload: contract.onFileUpload,
      onVideoRecordingUpload: contract.onVideoRecordingUpload
    };
  }
</script>

<div class="ui:space-y-3" data-testid="multi-part-question" data-stem-key={stemKey}>
  <QuestionRenderer
    contract={getContract(stem)}
    {questionNumber}
    questionNumberActive={false}
    hideAnswer
    {showContainer}
  />

  <div class="ui:space-y-3 ui:border-l-2 ui:pl-4">
    {#each parts as part, partIndex (getExerciseQuestionContractKey(part, partIndex))}
      <div data-testid="multi-part-part">
        <QuestionRenderer
          contract={getContract(part)}
          partLabel={getPartLabel(partIndex)}
          onAnswerChange={(answer) => onAnswerChange(part, answer)}
          {showContainer}
        />
        {#if scoresByKey}
          <p class="ui:text-muted-foreground ui:mt-1 ui:text-xs" data-testid="part-score">
            {scoresByKey[getExerciseQuestionContractKey(part)] ?? 0} / {part.points ?? 0}
          </p>
        {/if}
      </div>
    {/each}
  </div>

  {#if partsEarned !== null}
    <p class="ui:text-sm ui:font-medium" data-testid="multi-part-score">
      {scoreLabel}
      {partsEarned} / {partsTotal}
    </p>
  {/if}
</div>
