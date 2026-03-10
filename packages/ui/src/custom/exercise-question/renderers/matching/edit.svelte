<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';

  let { labels }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);
</script>

<div class="ui:space-y-2">
  <p class="ui:text-muted-foreground ui:text-xs">{label('matching.edit.helper')}</p>
</div>
