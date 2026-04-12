<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getStarRatingMaxFromSettings,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';

  import StarRow from './star-row.svelte';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const maxStars = $derived(getStarRatingMaxFromSettings(question.settings));

  const selectedValue = $derived.by(() => {
    if (answer?.type !== 'STAR') return 0;
    const value = answer.value;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > maxStars) return 0;
    return value;
  });

  function starLabel(starIndex: number) {
    return label('star.take.star_sr', 'Star {n} of {max}')
      .replace('{n}', String(starIndex))
      .replace('{max}', String(maxStars));
  }
</script>

<div class="ui:space-y-2">
  <p class="ui:text-muted-foreground ui:text-sm">{label('star.take.helper')}</p>
  <StarRow
    {maxStars}
    value={selectedValue}
    {disabled}
    {starLabel}
    onPick={(starIndex) => onAnswerChange({ type: 'STAR', value: starIndex })}
  />
</div>
