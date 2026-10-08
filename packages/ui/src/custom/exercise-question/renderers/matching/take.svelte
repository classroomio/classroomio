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

  const pairs = new FieldDraft<Array<{ left: string; right: string }>, string>({
    value: () => (answer?.type === 'MATCHING' ? answer.pairs : []),
    format: (list) => (list.length === 0 ? '' : JSON.stringify(list, null, 2)),
    parse: parsePairs,
    onChange: (next) => onAnswerChange({ type: 'MATCHING', pairs: next })
  });
</script>

<div class="ui:space-y-2">
  <Textarea
    class="ui:w-full"
    rows={4}
    value={pairs.draft}
    {disabled}
    placeholder={label('matching.take.placeholder')}
    oninput={(event) => pairs.input(event.currentTarget.value)}
  />
</div>
