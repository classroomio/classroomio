<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { Input } from '../../../../base/input';
  import { FieldDraft } from '../../../../hooks/field-draft.svelte';

  let {
    question,
    answer,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const blanks = new FieldDraft<string[]>({
    value: () => (answer?.type === 'FILL_BLANK' ? answer.values : []),
    format: (values) => values.join(', '),
    parse: (draft) =>
      draft
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean),
    onChange: (values) => onAnswerChange({ type: 'FILL_BLANK', values })
  });
</script>

<div class="ui:space-y-2">
  <Input
    class="ui:w-full ui:max-w-[300px]"
    value={blanks.draft}
    {disabled}
    placeholder={label('fill_blank.take.placeholder')}
    oninput={(event) => blanks.input(event.currentTarget.value)}
  />
</div>
