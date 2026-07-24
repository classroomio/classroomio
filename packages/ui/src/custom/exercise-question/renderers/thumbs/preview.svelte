<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Badge } from '../../../../base/badge';
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
  <Badge variant="success" class="ui:gap-1.5">
    <CheckIcon aria-hidden="true" class="custom ui:size-3.5" />
    {label('thumbs.preview.correct_value_label')}: {correctValue}
  </Badge>
</div>
