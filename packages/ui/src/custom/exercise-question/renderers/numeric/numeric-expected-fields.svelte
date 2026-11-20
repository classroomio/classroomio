<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { MathText } from '../../../math-text';
  import { correctValueToMathText } from './numeric-utils';

  let { question, labels }: Pick<ExerciseQuestionRendererProps, 'question' | 'labels'> = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const correctValueText = $derived(
    correctValueToMathText(question.settings?.correctValue as number | string | undefined)
  );
  const tolerance = $derived(question.settings?.tolerance as number | undefined);
</script>

<div class="ui:space-y-1">
  <p class="ui:text-muted-foreground ui:text-sm">
    {label('numeric.preview.correct_value_label')}: {#if correctValueText}<MathText
        text={correctValueText}
      />{:else}{label('common.not_set')}{/if}
  </p>
  <p class="ui:text-muted-foreground ui:text-sm">{label('numeric.preview.tolerance_label')}: {tolerance ?? 0}</p>
</div>
