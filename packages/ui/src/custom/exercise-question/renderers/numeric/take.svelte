<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { NumberField } from '../../../number-field';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);
</script>

<div class="ui:space-y-2">
  <NumberField
    className="ui:w-full ui:max-w-[300px]"
    value={answer?.type === 'NUMERIC' ? answer.value : null}
    isDisabled={disabled}
    placeholder={label('numeric.take.placeholder')}
    allowEmpty
    onValueChange={(next) => onAnswerChange(next === null ? null : { type: 'NUMERIC', value: next })}
  />
</div>
