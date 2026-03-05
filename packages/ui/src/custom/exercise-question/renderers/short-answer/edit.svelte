<script lang="ts">
  import {
    getExerciseQuestionLabel,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { Textarea } from '../../../../base/textarea';

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  function patchQuestion(partial: Partial<ExerciseQuestionModel>) {
    onQuestionChange({ ...question, ...partial });
  }
</script>

<div class="ui:space-y-3">
  <Textarea
    class="ui:w-full"
    rows={2}
    placeholder={label('short_answer.edit.instructions_placeholder')}
    value={String((question.settings?.instructions as string | undefined) ?? '')}
    {disabled}
    onchange={(event) =>
      patchQuestion({ settings: { ...(question.settings ?? {}), instructions: event.currentTarget.value } })}
  />
</div>
