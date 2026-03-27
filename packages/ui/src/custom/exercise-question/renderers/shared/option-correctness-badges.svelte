<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionLabels } from '@cio/question-types';
  import { Badge } from '../../../../base/badge';

  interface Props {
    labels: ExerciseQuestionLabels | undefined;
    showCorrect?: boolean;
    showIncorrect?: boolean;
  }

  let { labels, showCorrect = false, showIncorrect = false }: Props = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);
</script>

{#if showCorrect}
  <Badge variant="success" class="ui:ml-2">{label('common.correct_badge')}</Badge>
{/if}
{#if showIncorrect}
  <Badge variant="destructive" class="ui:ml-2">{label('common.incorrect_badge')}</Badge>
{/if}
