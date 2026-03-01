<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Input } from '../../../../base/input';

  let {
    question,
    answer = [],
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const value = $derived.by(() => {
    if (Array.isArray(answer)) {
      return answer
        .map((token) => String(token).trim())
        .filter(Boolean)
        .join(', ');
    }

    if (typeof answer === 'string') {
      return answer;
    }

    return '';
  });
</script>

<div class="ui:space-y-2">
  <Input
    class="ui:w-full ui:max-w-[300px]"
    {value}
    {disabled}
    placeholder={label('fill_blank.take.placeholder')}
    onchange={(event) =>
      onAnswerChange(
        event.currentTarget.value
          .split(',')
          .map((token) => token.trim())
          .filter(Boolean)
      )}
  />
</div>
