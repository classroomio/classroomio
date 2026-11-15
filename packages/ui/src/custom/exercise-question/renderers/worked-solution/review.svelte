<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getMathQuestionLabel,
    getWorkedSolutionPointSplit,
    readMathExpressionSettings,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { MathText } from '../../../math-text';
  import LabeledValueRow from '../shared/labeled-value-row.svelte';
  import MathGradeResult from '../math/math-grade-result.svelte';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const current = $derived(answer?.type === 'WORKED_SOLUTION' ? answer : null);
  const settings = $derived(readMathExpressionSettings(question.settings));
  const split = $derived(getWorkedSolutionPointSplit(question.settings, Number(question.points ?? 0)));
  const acceptedText = $derived(settings.acceptedAnswers.map((accepted) => `$${accepted}$`).join(',  '));
  const hasWorking = $derived(
    Boolean(current && (current.working.lines.length > 0 || current.working.files.length > 0))
  );
</script>

<div class="ui:space-y-3">
  <LabeledValueRow
    label={getMathQuestionLabel(labels, 'math.worked.take.answer_label')}
    value={current?.latex ? `$${current.latex}$` : getExerciseQuestionLabel(labels, 'common.not_set')}
  />
  {#if current?.grading}
    <MathGradeResult
      reason={current.grading.reason}
      requiredForm={current.grading.requiredForm}
      feedback={current.grading.feedback}
      matchedAnswer={current.grading.matchedAnswer}
      {labels}
    />
  {/if}
  {#if acceptedText}
    <LabeledValueRow label={getMathQuestionLabel(labels, 'math.review.expected')} value={acceptedText} />
  {/if}

  <div class="ui:space-y-2">
    <p class="ui:text-sm ui:font-medium">{getMathQuestionLabel(labels, 'math.worked.review.working_label')}</p>
    {#if hasWorking && current}
      <ol class="ui:list-decimal ui:space-y-1 ui:pl-5 ui:text-sm">
        {#each current.working.lines.filter((line) => line.trim()) as line, lineIndex (lineIndex)}
          <li><MathText text={`$${line}$`} /></li>
        {/each}
      </ol>
      {#if current.working.files.length > 0}
        <div class="ui:flex ui:flex-wrap ui:gap-3">
          {#each current.working.files as file, fileIndex (`${file.fileKey}-${fileIndex}`)}
            <a href={file.fileUrl ?? file.fileKey} target="_blank" rel="noopener noreferrer">
              <img
                src={file.fileUrl ?? file.fileKey}
                alt={getMathQuestionLabel(
                  labels,
                  file.kind === 'drawing' ? 'math.worked.take.drawing_alt' : 'math.worked.take.photo_alt'
                )}
                class="ui:max-h-48 ui:max-w-full ui:rounded-md ui:border ui:bg-white"
              />
            </a>
          {/each}
        </div>
      {/if}
    {:else}
      <p class="ui:text-muted-foreground ui:text-sm">{getMathQuestionLabel(labels, 'math.worked.review.no_working')}</p>
    {/if}
    <p class="ui:text-muted-foreground ui:text-xs">
      {getMathQuestionLabel(labels, 'math.worked.review.answer_points')}: {split.answerPoints}
      · {getMathQuestionLabel(labels, 'math.worked.review.working_points')}: {split.workingPoints}
    </p>
  </div>
</div>
