<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { getTrueFalseCorrectIsTrue } from './true-false-correct';

  let { question, labels }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const correctValue = $derived(
    getTrueFalseCorrectIsTrue(question.settings as Record<string, unknown> | undefined, question.options)
      ? label('true_false.true_label')
      : label('true_false.false_label')
  );
</script>

<div class="ui:space-y-1">
  <p class="ui:text-muted-foreground ui:text-sm">{label('true_false.preview.correct_value_label')}: {correctValue}</p>
</div>
