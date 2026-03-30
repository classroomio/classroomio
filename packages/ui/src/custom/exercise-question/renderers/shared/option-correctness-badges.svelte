<script lang="ts">
  import CheckIcon from '@lucide/svelte/icons/check';
  import XIcon from '@lucide/svelte/icons/x';
  import { getExerciseQuestionLabel, type ExerciseQuestionLabels } from '@cio/question-types';
  import { Badge } from '../../../../base/badge';

  interface Props {
    labels: ExerciseQuestionLabels | undefined;
    showCorrect?: boolean;
    showIncorrect?: boolean;
  }

  let { labels, showCorrect = false, showIncorrect = false }: Props = $props();

  const ariaCorrectLabel = $derived(getExerciseQuestionLabel(labels, 'common.correct_badge', 'Correct'));
  const ariaIncorrectLabel = $derived(getExerciseQuestionLabel(labels, 'common.incorrect_badge', 'Incorrect'));
</script>

{#if showCorrect}
  <Badge variant="success" class="ui:ml-2 ui:p-1" aria-label={ariaCorrectLabel} title={ariaCorrectLabel}>
    <CheckIcon aria-hidden="true" class="custom" />
  </Badge>
{/if}
{#if showIncorrect}
  <Badge variant="destructive" class="ui:ml-2 ui:p-1" aria-label={ariaIncorrectLabel} title={ariaIncorrectLabel}>
    <XIcon aria-hidden="true" class="custom" />
  </Badge>
{/if}
