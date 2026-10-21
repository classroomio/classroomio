<script lang="ts">
  import {
    getExerciseQuestionLabel,
    getStarRatingMaxFromSettings,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import CircleQuestionMarkIcon from '@lucide/svelte/icons/circle-question-mark';
  import { NumberField } from '../../../number-field';
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

  function onMaxStarsValueChange(next: number | null) {
    patchSettings({ maxStars: next ?? undefined });
  }

  function onMaxStarsCommit() {
    const max = getStarRatingMaxFromSettings(question.settings);
    const rawCorrect = question.settings?.correctValue;
    const currentCorrect = typeof rawCorrect === 'number' ? rawCorrect : rawCorrect != null ? Number(rawCorrect) : NaN;
    if (!Number.isFinite(currentCorrect)) return;

    const clamped = Math.min(max, Math.max(1, Math.floor(currentCorrect)));
    if (clamped !== currentCorrect) patchSettings({ correctValue: clamped });
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
      <NumberField
        integer
        min={1}
        max={maxStars}
        placeholder={label('star.edit.correct_value_placeholder')}
        value={(question.settings?.correctValue as number | undefined) ?? null}
        isDisabled={disabled}
        allowEmpty
        onValueChange={(next) => patchSettings({ correctValue: next ?? undefined })}
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
      <NumberField
        integer
        min={1}
        max={10}
        placeholder={label('star.edit.max_stars_placeholder')}
        value={(question.settings?.maxStars as number | undefined) ?? null}
        isDisabled={disabled}
        allowEmpty
        onValueChange={onMaxStarsValueChange}
        onCommit={onMaxStarsCommit}
      />
    </div>
  </div>
</div>
