<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import LabeledValueRow from '../shared/labeled-value-row.svelte';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  function stripHtml(raw: string): string {
    return raw.replace(/<[^>]*>/g, '').trim();
  }

  function normalizeToken(s: string): string {
    return s.trim().toLowerCase();
  }

  const studentText = $derived.by(() => {
    if (answer?.type !== 'SHORT_ANSWER') return '';
    return stripHtml(String(answer.text ?? ''));
  });

  const acceptedList = $derived.by(() => {
    const raw = question.settings?.acceptedAnswers;
    if (typeof raw !== 'string') return [] as string[];
    return raw
      .split(',')
      .map((token) => normalizeToken(token))
      .filter(Boolean);
  });
</script>

<div class="ui:space-y-2">
  <LabeledValueRow
    label={label('short_answer.review.your_answer_label')}
    value={studentText || label('common.not_set')}
  />
  {#if acceptedList.length > 0}
    <p class="ui:text-muted-foreground ui:text-sm">
      {label('short_answer.review.accepted_label')}: {acceptedList.join(', ')}
    </p>
  {:else}
    <p class="ui:text-muted-foreground ui:text-sm">{label('short_answer.preview.helper')}</p>
  {/if}
</div>
