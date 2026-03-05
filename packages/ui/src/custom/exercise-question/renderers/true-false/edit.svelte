<script lang="ts">
  import {
    getExerciseQuestionLabel,
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
    const opts = question.options ?? [];
    const options = opts.map((opt) => {
      const v = String(opt.value ?? opt.label ?? '').toLowerCase();
      const isTrue = v === 'true' || v === '1';
      const isFalse = v === 'false' || v === '0';
      const isCorrect = (isTrue && correctValue) || (isFalse && !correctValue);
      return isTrue || isFalse ? { ...opt, isCorrect } : opt;
    });

    patchQuestion({
      settings: { ...(question.settings ?? {}), correctValue },
      options:
        options.length >= 2
          ? options
          : [
              { id: `${Date.now()}-true`, label: 'True', value: 'true', isCorrect: correctValue },
              { id: `${Date.now()}-false`, label: 'False', value: 'false', isCorrect: !correctValue }
            ]
    });
  }

  const selectedValue = $derived.by(() => {
    const correctOpt = (question.options ?? []).find((o) => o.isCorrect);
    if (correctOpt) {
      const v = String(correctOpt.value ?? correctOpt.label).toLowerCase();
      return v === 'false' || v === '0' ? 'false' : 'true';
    }
    const fromSettings = question.settings?.correctValue as boolean | undefined;
    return typeof fromSettings === 'boolean' ? String(fromSettings) : 'true';
  });
</script>

<div class="ui:space-y-3">
  <div class="ui:space-y-2">
    <p class="ui:text-sm ui:font-medium">{label('true_false.edit.correct_answer_label')}</p>
    <ToggleGroup.Root
      type="single"
      value={selectedValue}
      {disabled}
      variant="outline"
      onValueChange={handleCorrectValueChange}
      class="ui:w-fit"
    >
      <ToggleGroup.Item value="true">{label('true_false.true_label')}</ToggleGroup.Item>
      <ToggleGroup.Item value="false">{label('true_false.false_label')}</ToggleGroup.Item>
    </ToggleGroup.Root>
  </div>
</div>
