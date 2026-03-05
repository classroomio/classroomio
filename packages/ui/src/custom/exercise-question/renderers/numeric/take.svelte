<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Input } from '../../../../base/input';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const numericValue = $derived.by(() => {
    const val = answer?.type === 'NUMERIC' ? answer.value : undefined;
    if (typeof val === 'number' && Number.isFinite(val)) return String(val);
    return '';
  });
</script>

<div class="ui:space-y-2">
  <Input
    class="ui:w-full ui:max-w-[300px]"
    type="number"
    value={numericValue}
    {disabled}
    placeholder={label('numeric.take.placeholder')}
    onchange={(event) => {
      const rawValue = event.currentTarget.value.trim();
      if (rawValue === '') return;
      const num = Number(rawValue);
      onAnswerChange({ type: 'NUMERIC', value: Number.isNaN(num) ? 0 : num });
    }}
  />
</div>
