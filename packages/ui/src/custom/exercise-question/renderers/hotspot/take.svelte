<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Textarea } from '../../../../base/textarea';
  import { FieldDraft } from '../../../../hooks/field-draft.svelte';

  let {
    question,
    answer = null,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

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

  const coordinates = new FieldDraft<Array<{ x: number; y: number }>, string>({
    value: () => (answer?.type === 'HOTSPOT' ? answer.coordinates : []),
    format: (list) => (list.length === 0 ? '' : JSON.stringify(list, null, 2)),
    parse: parseCoordinates,
    onChange: (next) => onAnswerChange({ type: 'HOTSPOT', coordinates: next })
  });
</script>

<div class="ui:space-y-2">
  <Textarea
    class="ui:w-full"
    rows={4}
    value={coordinates.draft}
    {disabled}
    placeholder={label('hotspot.take.placeholder')}
    oninput={(event) => coordinates.input(event.currentTarget.value)}
  />
</div>
