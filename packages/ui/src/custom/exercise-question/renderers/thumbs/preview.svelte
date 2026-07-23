<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { getThumbsCorrectIsYes } from './thumbs-correct';

  let { question, labels }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const correctValue = $derived(
    getThumbsCorrectIsYes(question.settings as Record<string, unknown> | undefined, question.options)
      ? label('thumbs.yes_label')
      : label('thumbs.no_label')
  );
</script>

<div class="ui:space-y-1">
  <p class="ui:text-muted-foreground ui:text-sm">{label('thumbs.preview.correct_value_label')}: {correctValue}</p>
</div>
