<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';

  let { question, labels }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const correctValue = $derived(question.settings?.correctValue as number | undefined);
  const tolerance = $derived(question.settings?.tolerance as number | undefined);
</script>

<div class="ui:space-y-1">
  <p class="ui:text-muted-foreground ui:text-sm">
    {label('numeric.preview.correct_value_label')}: {correctValue ?? label('common.not_set')}
  </p>
  <p class="ui:text-muted-foreground ui:text-sm">{label('numeric.preview.tolerance_label')}: {tolerance ?? 0}</p>
</div>
