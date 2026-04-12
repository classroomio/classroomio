<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getStarRatingMaxFromSettings,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import CircleQuestionMarkIcon from '@lucide/svelte/icons/circle-question-mark';
  import { Input } from '../../../../base/input';
  import { IconButton } from '../../../icon-button';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  function patchQuestion(partial: Partial<ExerciseQuestionModel>) {
    onQuestionChange({ ...question, ...partial });
  }

  function patchSettings(next: Record<string, unknown>) {
    patchQuestion({ settings: { ...(question.settings ?? {}), ...next } });
  }

  const maxStars = $derived(getStarRatingMaxFromSettings(question.settings));

  function onCorrectValueChange(raw: string) {
    const parsed = Number(raw);
    if (raw.trim() === '' || Number.isNaN(parsed)) {
      patchSettings({ correctValue: undefined });
      return;
    }

    const clamped = Math.min(maxStars, Math.max(1, Math.floor(parsed)));
    patchSettings({ correctValue: clamped });
  }

  function onMaxStarsChange(raw: string) {
    const parsed = Number(raw);
    if (raw.trim() === '' || Number.isNaN(parsed)) {
      patchSettings({ maxStars: undefined });
      return;
    }

    const nextMax = Math.min(10, Math.max(1, Math.floor(parsed)));
    const rawCorrect = question.settings?.correctValue;
    const currentCorrect = typeof rawCorrect === 'number' ? rawCorrect : rawCorrect != null ? Number(rawCorrect) : NaN;
    const nextCorrect = Number.isFinite(currentCorrect)
      ? Math.min(nextMax, Math.max(1, Math.floor(currentCorrect)))
      : undefined;

    if (nextCorrect !== undefined) {
      patchSettings({ maxStars: nextMax, correctValue: nextCorrect });
      return;
    }

    patchSettings({ maxStars: nextMax });
  }
</script>

<div class="ui:space-y-3">
  <div class="ui:grid ui:gap-3 ui:md:grid-cols-2">
    <div class="ui:space-y-1">
      <div class="ui:flex ui:items-center ui:gap-1">
        <p class="ui:text-sm ui:font-medium">{label('star.edit.correct_value_label')}</p>
        <IconButton type="button" class="ui:h-6 ui:w-6" {disabled} tooltip={label('star.edit.correct_value_info')}>
          <CircleQuestionMarkIcon class="ui:size-3.5" />
          <span class="ui:sr-only">{label('star.edit.correct_value_info')}</span>
        </IconButton>
      </div>
      <Input
        type="number"
        min="1"
        max={maxStars}
        placeholder={label('star.edit.correct_value_placeholder')}
        value={String((question.settings?.correctValue as number | undefined) ?? '')}
        {disabled}
        onchange={(event) => onCorrectValueChange(event.currentTarget.value)}
      />
    </div>

    <div class="ui:space-y-1">
      <div class="ui:flex ui:items-center ui:gap-1">
        <p class="ui:text-sm ui:font-medium">{label('star.edit.max_stars_label')}</p>
        <IconButton type="button" class="ui:h-6 ui:w-6" {disabled} tooltip={label('star.edit.max_stars_info')}>
          <CircleQuestionMarkIcon class="ui:size-3.5" />
          <span class="ui:sr-only">{label('star.edit.max_stars_info')}</span>
        </IconButton>
      </div>
      <Input
        type="number"
        min="1"
        max="10"
        placeholder={label('star.edit.max_stars_placeholder')}
        value={String((question.settings?.maxStars as number | undefined) ?? '')}
        {disabled}
        onchange={(event) => onMaxStarsChange(event.currentTarget.value)}
      />
    </div>
  </div>
</div>
