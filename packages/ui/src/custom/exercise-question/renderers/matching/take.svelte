<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Textarea } from '../../../../base/textarea';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const value = $derived.by(() => {
    if (answer?.type === 'MATCHING') return JSON.stringify(answer.pairs, null, 2);
    return '';
  });

  function parsePairs(raw: string): Array<{ left: string; right: string }> {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (p): p is { left: string; right: string } =>
          p &&
          typeof p === 'object' &&
          typeof (p as { left?: unknown }).left === 'string' &&
          typeof (p as { right?: unknown }).right === 'string'
      );
    } catch {
      return [];
    }
  }
</script>

<div class="ui:space-y-2">
  <Textarea
    class="ui:w-full"
    rows={4}
    {value}
    {disabled}
    placeholder={label('matching.take.placeholder')}
    onchange={(event) => {
      const pairs = parsePairs(event.currentTarget.value);
      onAnswerChange({ type: 'MATCHING', pairs });
    }}
  />
</div>
