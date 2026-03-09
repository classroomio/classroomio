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
    if (answer?.type === 'HOTSPOT') return JSON.stringify(answer.coordinates, null, 2);
    return '';
  });

  function parseCoordinates(raw: string): Array<{ x: number; y: number }> {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (c): c is { x: number; y: number } =>
          c &&
          typeof c === 'object' &&
          typeof (c as { x?: unknown }).x === 'number' &&
          typeof (c as { y?: unknown }).y === 'number'
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
    placeholder={label('hotspot.take.placeholder')}
    onchange={(event) => {
      const coordinates = parseCoordinates(event.currentTarget.value);
      onAnswerChange({ type: 'HOTSPOT', coordinates });
    }}
  />
</div>
