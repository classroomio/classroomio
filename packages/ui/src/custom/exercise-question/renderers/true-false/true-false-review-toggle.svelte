<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionLabels } from '@cio/question-types';
  import * as ToggleGroup from '../../../../base/toggle-group';
  import OptionCorrectnessBadges from '../shared/option-correctness-badges.svelte';

  interface Props {
    labels: ExerciseQuestionLabels | undefined;
    correctIsTrue: boolean;
    studentValue: string;
    isCorrect: boolean | null;
  }

  let { labels, correctIsTrue, studentValue, isCorrect }: Props = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);
</script>

<div class="ui:space-y-2">
  <ToggleGroup.Root type="single" value={studentValue} disabled={true} variant="outline">
    <ToggleGroup.Item
      value="true"
      class={correctIsTrue ? 'ui:border-emerald-500 ui:bg-emerald-50/40 ui:dark:bg-emerald-950/30' : ''}
    >
      {label('true_false.true_label')}
      <OptionCorrectnessBadges
        {labels}
        showCorrect={correctIsTrue}
        showIncorrect={studentValue === 'true' && isCorrect === false}
      />
    </ToggleGroup.Item>
    <ToggleGroup.Item
      value="false"
      class={!correctIsTrue ? 'ui:border-emerald-500 ui:bg-emerald-50/40 ui:dark:bg-emerald-950/30' : ''}
    >
      {label('true_false.false_label')}
      <OptionCorrectnessBadges
        {labels}
        showCorrect={!correctIsTrue}
        showIncorrect={studentValue === 'false' && isCorrect === false}
      />
    </ToggleGroup.Item>
  </ToggleGroup.Root>
</div>
