<script lang="ts">
  import { untrack } from 'svelte';
  import { Button, ExerciseQuestion, VideoCheckpoint } from '@cio/ui';
  import { QUESTION_LABELS } from '../exercise-question/question-labels';
  import { answersMatch, isCheckpointAnswerComplete } from './checkpoint-answer-complete';
  import VideoCheckpointPlayerFrame from './video-checkpoint-player-frame.svelte';

  interface Props {
    question: Record<string, unknown>;
    kicker: string;
    continueLabel?: string;
    initialAnswer?: unknown;
    resumePolicy?: 'any' | 'correct';
    correctAnswer?: unknown;
    tryAgainMessage?: string;
    initialErrorMessage?: string;
    timestampLabel?: string;
    durationLabel?: string;
    progressPercent?: number;
  }

  let {
    question,
    kicker,
    continueLabel = 'Continue',
    initialAnswer = null,
    resumePolicy = 'any',
    correctAnswer = undefined,
    tryAgainMessage = 'Try again — that is not the correct answer.',
    initialErrorMessage = '',
    timestampLabel = '0:45',
    durationLabel = '6:12',
    progressPercent = 12
  }: Props = $props();

  let answer = $state<unknown>(untrack(() => initialAnswer));
  let errorMessage = $state(untrack(() => initialErrorMessage));
  let overlayOpen = $state(true);

  const continueDisabled = $derived(!isCheckpointAnswerComplete(answer));

  function handleAnswerChange(nextAnswer: unknown) {
    answer = nextAnswer;
    errorMessage = '';
  }

  function handleContinue() {
    if (continueDisabled) return;

    if (resumePolicy === 'correct' && !answersMatch(answer, correctAnswer)) {
      errorMessage = tryAgainMessage;
      return;
    }

    overlayOpen = false;
    errorMessage = '';
  }

  function replayCheckpoint() {
    answer = initialAnswer;
    errorMessage = initialErrorMessage;
    overlayOpen = true;
  }
</script>

<div class="mx-auto w-full max-w-3xl space-y-3">
  <VideoCheckpointPlayerFrame {timestampLabel} {durationLabel} {progressPercent}>
    {#if overlayOpen}
      <VideoCheckpoint.Overlay {kicker} {continueLabel} {continueDisabled} {errorMessage} onContinue={handleContinue}>
        {#snippet questionBody()}
          <ExerciseQuestion.QuestionRenderer
            showContainer={false}
            contract={{
              mode: 'take',
              question,
              answer,
              labels: QUESTION_LABELS
            }}
            onAnswerChange={handleAnswerChange}
          />
        {/snippet}
      </VideoCheckpoint.Overlay>
    {/if}
  </VideoCheckpointPlayerFrame>

  {#if !overlayOpen}
    <Button.Root type="button" variant="outline" size="sm" onclick={replayCheckpoint}>Replay checkpoint</Button.Root>
  {/if}
</div>
