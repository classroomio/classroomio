<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';
  import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
  import XIcon from '@lucide/svelte/icons/x';
  import { getExerciseQuestionLabel, type ExerciseQuestionLabels } from '@cio/question-types';
  import * as ToggleGroup from '../../../../base/toggle-group';

  interface Props {
    labels: ExerciseQuestionLabels | undefined;
    correctIsYes: boolean;
    studentValue: string;
    isCorrect: boolean | null;
  }

  let { labels, correctIsYes, studentValue, isCorrect }: Props = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const yesLabel = $derived(label('thumbs.yes_label'));
  const noLabel = $derived(label('thumbs.no_label'));
  const correctValueLabel = $derived(correctIsYes ? yesLabel : noLabel);

  const correctAnswerFooter = $derived(
    `${label('thumbs.review.correct_answer_label', 'Correct answer:')} ${correctValueLabel}`
  );

  const ariaCorrectLabel = $derived(label('common.correct_badge', 'Correct'));
  const ariaIncorrectLabel = $derived(label('common.incorrect_badge', 'Incorrect'));

  function itemClass(value: 'true' | 'false') {
    const isSelected = studentValue === value;
    const isThisCorrectOption = (value === 'true') === correctIsYes;
    const base = 'ui:min-w-28 ui:gap-2 ui:px-6 ui:disabled:opacity-100';

    if (isCorrect === true) {
      if (isSelected) {
        return `${base} ui:border-emerald-600 ui:bg-emerald-600 ui:text-emerald-950 ui:hover:bg-emerald-600 ui:hover:text-emerald-950 ui:data-[state=on]:bg-emerald-600 ui:data-[state=on]:text-emerald-950 ui:dark:text-emerald-950`;
      }

      return `${base} ui:text-muted-foreground ui:opacity-50`;
    }

    if (isCorrect === false) {
      if (isSelected) {
        return `${base} ui:border-red-900 ui:bg-red-950 ui:text-red-400 ui:hover:bg-red-950 ui:hover:text-red-400 ui:data-[state=on]:bg-red-950 ui:data-[state=on]:text-red-400`;
      }

      if (isThisCorrectOption) {
        return `${base} ui:border-emerald-600 ui:bg-transparent ui:text-emerald-600 ui:hover:bg-transparent ui:hover:text-emerald-600 ui:data-[state=on]:bg-transparent ui:data-[state=on]:text-emerald-600 ui:dark:text-emerald-400 ui:dark:hover:text-emerald-400 ui:dark:data-[state=on]:text-emerald-400`;
      }

      return `${base} ui:text-muted-foreground ui:opacity-50`;
    }

    if (isThisCorrectOption) {
      return `${base} ui:border-emerald-500 ui:bg-emerald-50/40 ui:dark:bg-emerald-950/30`;
    }

    return base;
  }
</script>

<div class="ui:space-y-2">
  <ToggleGroup.Root type="single" value={studentValue} disabled={true} variant="outline">
    <ToggleGroup.Item value="true" class={itemClass('true')}>
      <ThumbsUpIcon aria-hidden="true" class="custom ui:size-4" />
      {yesLabel}
      {#if studentValue === 'true' && isCorrect === true}
        <CheckIcon aria-label={ariaCorrectLabel} class="custom ui:size-4" />
      {:else if studentValue === 'true' && isCorrect === false}
        <XIcon aria-label={ariaIncorrectLabel} class="custom ui:size-4" />
      {/if}
    </ToggleGroup.Item>
    <ToggleGroup.Item value="false" class={itemClass('false')}>
      <ThumbsDownIcon aria-hidden="true" class="custom ui:size-4" />
      {noLabel}
      {#if studentValue === 'false' && isCorrect === true}
        <CheckIcon aria-label={ariaCorrectLabel} class="custom ui:size-4" />
      {:else if studentValue === 'false' && isCorrect === false}
        <XIcon aria-label={ariaIncorrectLabel} class="custom ui:size-4" />
      {/if}
    </ToggleGroup.Item>
  </ToggleGroup.Root>

  {#if isCorrect === false}
    <p class="ui:text-sm ui:font-medium ui:text-emerald-700 ui:dark:text-emerald-400">{correctAnswerFooter}</p>
  {/if}
</div>
