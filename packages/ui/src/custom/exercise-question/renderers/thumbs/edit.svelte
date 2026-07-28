<script lang="ts">
  import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';
  import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
  import {
    getExerciseQuestionLabel,
    resolveTrueFalseCorrectValue,
    syncTrueFalseOptions,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { Input } from '../../../../base/input';
  import * as ToggleGroup from '../../../../base/toggle-group';
  import { getThumbsOptionLabel } from './thumbs-options';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const defaultYesLabel = $derived(label('thumbs.yes_label', 'Yes'));
  const defaultNoLabel = $derived(label('thumbs.no_label', 'No'));

  const yesLabel = $derived(getThumbsOptionLabel(question.options, true, defaultYesLabel, defaultNoLabel));
  const noLabel = $derived(getThumbsOptionLabel(question.options, false, defaultYesLabel, defaultNoLabel));

  function patchQuestion(partial: Partial<ExerciseQuestionModel>) {
    onQuestionChange({ ...question, ...partial });
  }

  function ensureThumbsOptions(correctValue: boolean) {
    const timestamp = Date.now();
    const existing = question.options ?? [];
    const yesOption = existing.find(
      (option) =>
        !option.deletedAt &&
        String(option.value ?? '')
          .trim()
          .toLowerCase() === 'true'
    );
    const noOption = existing.find(
      (option) =>
        !option.deletedAt &&
        String(option.value ?? '')
          .trim()
          .toLowerCase() === 'false'
    );

    const nextOptions = [
      {
        ...(yesOption ?? { id: `${timestamp}-yes` }),
        label: yesOption?.label?.trim() || defaultYesLabel,
        value: 'true',
        isCorrect: correctValue
      },
      {
        ...(noOption ?? { id: `${timestamp}-no` }),
        label: noOption?.label?.trim() || defaultNoLabel,
        value: 'false',
        isCorrect: !correctValue
      }
    ];

    return syncTrueFalseOptions(nextOptions, correctValue);
  }

  function handleCorrectValueChange(value: string) {
    if (value !== 'true' && value !== 'false') return;

    const correctValue = value === 'true';
    const options = ensureThumbsOptions(correctValue);
    const nextSettings = { ...(question.settings ?? {}), correctValue };

    patchQuestion({
      settings: nextSettings,
      options
    });
  }

  function handleOptionLabelChange(value: boolean, nextLabel: string) {
    const correctValue = resolveTrueFalseCorrectValue(
      question.settings as Record<string, unknown> | undefined,
      question.options
    );
    const options = ensureThumbsOptions(correctValue).map((option) => {
      const optionValue =
        String(option.value ?? '')
          .trim()
          .toLowerCase() === 'true';

      if (optionValue !== value) return option;

      return { ...option, label: nextLabel };
    });

    patchQuestion({ options });
  }

  const selectedValue = $derived.by(() => {
    return String(
      resolveTrueFalseCorrectValue(question.settings as Record<string, unknown> | undefined, question.options)
    );
  });
</script>

<div class="ui:space-y-3">
  <div class="ui:space-y-2">
    <p class="ui:text-sm ui:font-medium">{label('thumbs.edit.correct_answer_label')}</p>
    <ToggleGroup.Root
      type="single"
      value={selectedValue}
      {disabled}
      variant="outline"
      onValueChange={handleCorrectValueChange}
      class="ui:w-fit"
    >
      <ToggleGroup.Item value="true" class="ui:min-w-28 ui:gap-2 ui:px-6">
        <ThumbsUpIcon aria-hidden="true" class="custom ui:size-4" />
        {yesLabel}
      </ToggleGroup.Item>
      <ToggleGroup.Item value="false" class="ui:min-w-28 ui:gap-2 ui:px-6">
        <ThumbsDownIcon aria-hidden="true" class="custom ui:size-4" />
        {noLabel}
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  </div>

  <div class="ui:grid ui:gap-3 ui:sm:grid-cols-2">
    <div class="ui:space-y-1.5">
      <label class="ui:text-sm ui:font-medium" for={`${question.id}-thumbs-yes-label`}>
        {label('thumbs.edit.positive_option_label')}
      </label>
      <Input
        id={`${question.id}-thumbs-yes-label`}
        value={yesLabel}
        {disabled}
        oninput={(event) => handleOptionLabelChange(true, event.currentTarget.value)}
      />
    </div>
    <div class="ui:space-y-1.5">
      <label class="ui:text-sm ui:font-medium" for={`${question.id}-thumbs-no-label`}>
        {label('thumbs.edit.negative_option_label')}
      </label>
      <Input
        id={`${question.id}-thumbs-no-label`}
        value={noLabel}
        {disabled}
        oninput={(event) => handleOptionLabelChange(false, event.currentTarget.value)}
      />
    </div>
  </div>
</div>
