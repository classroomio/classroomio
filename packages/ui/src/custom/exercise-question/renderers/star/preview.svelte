<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getStarRatingMaxFromSettings,
    isValidStarRatingValue,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';

  import StarRow from './star-row.svelte';

  let { question, labels }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const maxStars = $derived(getStarRatingMaxFromSettings(question.settings));

  const correctValue = $derived.by(() => {
    const rawCorrect = question.settings?.correctValue;
    const parsed = typeof rawCorrect === 'number' ? rawCorrect : rawCorrect != null ? Number(rawCorrect) : NaN;
    if (!isValidStarRatingValue(parsed, maxStars)) return 0;
    return parsed;
  });
</script>

<div class="ui:space-y-2">
  <p class="ui:text-sm ui:font-medium">{label('star.preview.correct_label')}</p>
  <StarRow
    {maxStars}
    value={correctValue}
    disabled={true}
    starLabel={(starIndex) =>
      label('star.take.star_sr', 'Star {n} of {max}')
        .replace('{n}', String(starIndex))
        .replace('{max}', String(maxStars))}
  />
</div>
