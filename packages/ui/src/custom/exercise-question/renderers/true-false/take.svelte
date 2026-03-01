<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import * as ToggleGroup from '../../../../base/toggle-group';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const selected = $derived.by(() => {
    if (typeof answer === 'boolean') return answer ? 'true' : 'false';
    if (answer === 'true' || answer === 'false') return answer;
    return '';
  });

  function update(value: string) {
    if (value !== 'true' && value !== 'false') return;
    onAnswerChange(value === 'true');
  }
</script>

<div class="ui:space-y-2">
  <ToggleGroup.Root type="single" value={selected} {disabled} variant="outline" onValueChange={update}>
    <ToggleGroup.Item value="true">{label('true_false.true_label')}</ToggleGroup.Item>
    <ToggleGroup.Item value="false">{label('true_false.false_label')}</ToggleGroup.Item>
  </ToggleGroup.Root>
</div>
