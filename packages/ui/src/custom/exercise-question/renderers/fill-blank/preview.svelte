<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';

  let { question, labels }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);
</script>

<div class="ui:space-y-1">
  <p class="ui:text-muted-foreground ui:text-sm">
    {label('fill_blank.preview.accepted_answers_label')}:
    {String((question.settings?.acceptedAnswers as string | undefined) ?? label('common.not_set'))}
  </p>
</div>
