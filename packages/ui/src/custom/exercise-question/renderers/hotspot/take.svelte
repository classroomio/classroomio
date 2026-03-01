<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Textarea } from '../../../../base/textarea';

  let {
    question,
    answer = '',
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const value = $derived.by(() => {
    if (typeof answer === 'string') return answer;
    if (answer && typeof answer === 'object') return JSON.stringify(answer, null, 2);
    return '';
  });
</script>

<div class="ui:space-y-2">
  <Textarea
    class="ui:w-full"
    rows={4}
    {value}
    {disabled}
    placeholder={label('hotspot.take.placeholder')}
    onchange={(event) => onAnswerChange(event.currentTarget.value)}
  />
</div>
