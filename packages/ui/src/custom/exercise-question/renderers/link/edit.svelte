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

  function patchSettings(next: Record<string, unknown>) {
    patchQuestion({ settings: { ...(question.settings ?? {}), ...next } });
  }
</script>

<div class="ui:space-y-3">
  <Textarea
    class="ui:w-full"
    rows={2}
    placeholder={label('link.edit.instructions_placeholder')}
    value={String((question.settings?.instructions as string | undefined) ?? '')}
    {disabled}
    onchange={(event) => patchSettings({ instructions: event.currentTarget.value })}
  />

  <p class="ui:text-muted-foreground ui:text-xs">{label('link.edit.helper')}</p>
</div>
