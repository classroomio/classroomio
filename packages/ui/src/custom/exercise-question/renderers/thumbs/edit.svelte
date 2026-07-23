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
  import * as ToggleGroup from '../../../../base/toggle-group';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  function patchQuestion(partial: Partial<ExerciseQuestionModel>) {
    onQuestionChange({ ...question, ...partial });
  }

  function handleCorrectValueChange(value: string) {
    if (value !== 'true' && value !== 'false') return;

    const correctValue = value === 'true';
    const options = syncTrueFalseOptions(question.options, correctValue);

    patchQuestion({
      settings: { ...(question.settings ?? {}), correctValue },
      options:
        options.length >= 2
          ? options
          : [
              { id: `${Date.now()}-yes`, label: 'Yes', value: 'true', isCorrect: correctValue },
              { id: `${Date.now()}-no`, label: 'No', value: 'false', isCorrect: !correctValue }
            ]
    });
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
      <ToggleGroup.Item value="true" class="ui:gap-2">
        <ThumbsUpIcon aria-hidden="true" class="ui:size-4" />
        {label('thumbs.yes_label')}
      </ToggleGroup.Item>
      <ToggleGroup.Item value="false" class="ui:gap-2">
        <ThumbsDownIcon aria-hidden="true" class="ui:size-4" />
        {label('thumbs.no_label')}
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  </div>
</div>
