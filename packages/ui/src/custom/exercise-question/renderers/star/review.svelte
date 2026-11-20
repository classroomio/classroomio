<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getStarRatingMaxFromSettings,
    isValidStarRatingValue,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { cn } from '../../../../tools';

  import StarPreview from './preview.svelte';
  import StarRow from './star-row.svelte';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const maxStars = $derived(getStarRatingMaxFromSettings(question.settings));

  const selectedValue = $derived.by(() => {
    if (answer?.type !== 'STAR') return 0;

    return isValidStarRatingValue(answer.value, maxStars) ? answer.value : 0;
  });

  const correctValue = $derived.by(() => {
    const rawCorrect = question.settings?.correctValue;
    const parsed = typeof rawCorrect === 'number' ? rawCorrect : rawCorrect != null ? Number(rawCorrect) : NaN;

    return isValidStarRatingValue(parsed, maxStars) ? parsed : 0;
  });

  const isCorrect = $derived(selectedValue > 0 && correctValue > 0 ? selectedValue === correctValue : null);

  function starLabel(starIndex: number) {
    return label('star.take.star_sr', 'Star {n} of {max}')
      .replace('{n}', String(starIndex))
      .replace('{max}', String(maxStars));
  }
</script>

<div class="ui:space-y-3">
  <StarRow {maxStars} value={selectedValue} disabled={true} {starLabel} />
  {#if isCorrect !== null}
    <p class={cn('ui:text-xs', isCorrect ? 'ui:text-emerald-600' : 'ui:text-red-600')}>
      {isCorrect ? label('common.correct_badge', 'Correct') : label('common.incorrect_badge', 'Incorrect')}
    </p>
  {/if}
  {#if isCorrect === false}
    <StarPreview {question} {labels} />
  {/if}
</div>
