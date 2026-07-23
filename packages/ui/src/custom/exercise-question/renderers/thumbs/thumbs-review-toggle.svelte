<script lang="ts">
  import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';
  import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';
  import { getExerciseQuestionLabel, type ExerciseQuestionLabels } from '@cio/question-types';
  import * as ToggleGroup from '../../../../base/toggle-group';
  import OptionCorrectnessBadges from '../shared/option-correctness-badges.svelte';

  interface Props {
    labels: ExerciseQuestionLabels | undefined;
    correctIsYes: boolean;
    studentValue: string;
    isCorrect: boolean | null;
  }

  let { labels, correctIsYes, studentValue, isCorrect }: Props = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);
</script>

<div class="ui:space-y-2">
  <ToggleGroup.Root type="single" value={studentValue} disabled={true} variant="outline">
    <ToggleGroup.Item
      value="true"
      class={`ui:gap-2 ${correctIsYes ? 'ui:border-emerald-500 ui:bg-emerald-50/40 ui:dark:bg-emerald-950/30' : ''}`}
    >
      <ThumbsUpIcon aria-hidden="true" class="ui:size-4" />
      {label('thumbs.yes_label')}
      <OptionCorrectnessBadges
        {labels}
        showCorrect={correctIsYes}
        showIncorrect={studentValue === 'true' && isCorrect === false}
      />
    </ToggleGroup.Item>
    <ToggleGroup.Item
      value="false"
      class={`ui:gap-2 ${!correctIsYes ? 'ui:border-emerald-500 ui:bg-emerald-50/40 ui:dark:bg-emerald-950/30' : ''}`}
    >
      <ThumbsDownIcon aria-hidden="true" class="ui:size-4" />
      {label('thumbs.no_label')}
      <OptionCorrectnessBadges
        {labels}
        showCorrect={!correctIsYes}
        showIncorrect={studentValue === 'false' && isCorrect === false}
      />
    </ToggleGroup.Item>
  </ToggleGroup.Root>
</div>
