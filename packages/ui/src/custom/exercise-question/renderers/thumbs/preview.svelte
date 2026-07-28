<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Badge } from '../../../../base/badge';
  import { getThumbsCorrectIsYes } from './thumbs-correct';
  import { getThumbsOptionLabel } from './thumbs-options';

  let { question, labels }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const defaultYesLabel = $derived(label('thumbs.yes_label', 'Yes'));
  const defaultNoLabel = $derived(label('thumbs.no_label', 'No'));

  const correctValue = $derived(
    getThumbsCorrectIsYes(question.settings as Record<string, unknown> | undefined, question.options)
      ? getThumbsOptionLabel(question.options, true, defaultYesLabel, defaultNoLabel)
      : getThumbsOptionLabel(question.options, false, defaultYesLabel, defaultNoLabel)
  );
</script>

<div class="ui:space-y-1">
  <Badge variant="success" class="ui:gap-1.5">
    <CheckIcon aria-hidden="true" class="custom ui:size-3.5" />
    {label('thumbs.preview.correct_value_label')}: {correctValue}
  </Badge>
</div>
