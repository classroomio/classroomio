<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import LabeledValueRow from '../shared/labeled-value-row.svelte';
  import { countWordBankBlanks, parseWordBankTemplate } from './word-bank-utils';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const template = $derived(String((question.settings?.template as string | undefined) ?? ''));

  const correctAnswers = $derived.by(() => {
    const raw = question.settings?.correctAnswers;
    return Array.isArray(raw) ? (raw as string[]).map((s) => String(s ?? '')) : [];
  });

  const blankCount = $derived(countWordBankBlanks(template));
  const segments = $derived(parseWordBankTemplate(template));

  const studentFilled = $derived(answer?.type === 'WORD_BANK' ? answer.filledBlanks : []);

  function studentAtBlank(index: number): string {
    const v = studentFilled[index];
    return v != null && String(v).trim() ? String(v).trim() : label('common.not_set');
  }

  function correctAtBlank(index: number): string {
    const v = correctAnswers[index];
    return v != null && String(v).trim() ? String(v).trim() : label('common.not_set');
  }
</script>

<div class="ui:space-y-3">
  {#if blankCount === 0}
    <p class="ui:text-muted-foreground ui:text-sm">{label('common.not_set')}</p>
  {:else}
    <div class="ui:space-y-2">
      <p class="ui:text-muted-foreground ui:text-xs">{label('word_bank.review.your_answer_label')}</p>
      <div class="ui:bg-muted/30 ui:rounded-lg ui:border ui:p-4 ui:font-mono ui:text-sm ui:leading-relaxed">
        {#each segments as segment, segmentIndex (segmentIndex)}
          {#if segment.type === 'text'}
            <span>{segment.value}</span>
          {:else}
            <span
              class="ui:inline-flex ui:mx-0.5 ui:min-h-8 ui:min-w-[5rem] ui:items-center ui:justify-center ui:rounded ui:border-2 ui:border-solid ui:border-muted-foreground/40 ui:px-2 ui:py-0.5"
            >
              {studentAtBlank(segment.index)}
            </span>
          {/if}
        {/each}
      </div>
    </div>

    <div class="ui:space-y-2">
      <p class="ui:text-muted-foreground ui:text-xs">{label('word_bank.review.correct_label')}</p>
      <div class="ui:bg-muted/30 ui:rounded-lg ui:border ui:p-4 ui:font-mono ui:text-sm ui:leading-relaxed">
        {#each segments as segment, segmentIndex (segmentIndex)}
          {#if segment.type === 'text'}
            <span>{segment.value}</span>
          {:else}
            <span
              class="ui:inline-flex ui:mx-0.5 ui:min-h-8 ui:min-w-[5rem] ui:items-center ui:justify-center ui:rounded ui:border-2 ui:border-solid ui:border-primary ui:px-2 ui:py-0.5"
            >
              {correctAtBlank(segment.index)}
            </span>
          {/if}
        {/each}
      </div>
    </div>

    <div class="ui:space-y-1">
      {#each Array.from({ length: blankCount }, (_, i) => i) as blankIndex (blankIndex)}
        <LabeledValueRow
          label={`${label('word_bank.edit.blank_label')} ${blankIndex + 1}`}
          value={`${studentAtBlank(blankIndex)} → ${correctAtBlank(blankIndex)}`}
        />
      {/each}
    </div>
  {/if}
</div>
