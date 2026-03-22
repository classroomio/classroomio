<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import LabeledValueRow from '../shared/labeled-value-row.svelte';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const studentJoined = $derived.by(() => {
    if (answer?.type !== 'FILL_BLANK') return '';
    return answer.values
      .map((token) => String(token).trim())
      .filter(Boolean)
      .join(', ');
  });

  const acceptedRaw = $derived(String((question.settings?.acceptedAnswers as string | undefined) ?? ''));
</script>

<div class="ui:space-y-2">
  <LabeledValueRow
    label={label('fill_blank.review.your_answer_label')}
    value={studentJoined || label('common.not_set')}
  />
  <p class="ui:text-muted-foreground ui:text-sm">
    {label('fill_blank.preview.accepted_answers_label')}: {acceptedRaw || label('common.not_set')}
  </p>
</div>
