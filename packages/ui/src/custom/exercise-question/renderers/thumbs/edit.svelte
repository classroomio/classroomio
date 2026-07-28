<script lang="ts">
  import {
    getExerciseQuestionLabel,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { Input } from '../../../../base/input';
  import { ensureThumbsOptions, getThumbsOptionLabel } from './thumbs-options';

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

  function handleOptionLabelChange(value: boolean, nextLabel: string) {
    const options = ensureThumbsOptions(question.options, defaultYesLabel, defaultNoLabel).map((option) => {
      const optionValue =
        String(option.value ?? '')
          .trim()
          .toLowerCase() === 'true';

      if (optionValue !== value) return option;

      return { ...option, label: nextLabel };
    });

    patchQuestion({ options });
  }
</script>

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
