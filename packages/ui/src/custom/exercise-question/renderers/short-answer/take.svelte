<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Input } from '../../../../base/input';

  let {
    question,
    answer,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);
</script>

<div class="ui:space-y-2">
  <Input
    class="ui:w-full ui:max-w-[300px]"
    value={answer?.type === 'SHORT_ANSWER' ? answer.text : String(answer ?? '')}
    {disabled}
    placeholder={label('short_answer.take.placeholder')}
    onchange={(event) => onAnswerChange({ type: 'SHORT_ANSWER', text: event.currentTarget.value })}
  />
</div>
