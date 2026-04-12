<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { countWordBankBlanks, parseWordBankTemplate } from './word-bank-utils';

  let { question, labels }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const template = $derived(String((question.settings?.template as string | undefined) ?? ''));

  const correctAnswers = $derived.by(() => {
    const raw = question.settings?.correctAnswers;
    return Array.isArray(raw) ? (raw as string[]).map((s) => String(s ?? '')) : [];
  });

  const blankCount = $derived(countWordBankBlanks(template));
  const segments = $derived(parseWordBankTemplate(template));
</script>

<div class="ui:space-y-2">
  {#if blankCount === 0}
    <p class="ui:text-muted-foreground ui:text-sm">
      {label('word_bank.preview.filled_label')}: {label('common.not_set')}
    </p>
  {:else}
    <p class="ui:text-muted-foreground ui:text-sm">{label('word_bank.preview.filled_label')}</p>
    <div class="ui:bg-muted/30 ui:rounded-lg ui:border ui:p-4 ui:font-mono ui:text-sm ui:leading-relaxed">
      {#each segments as segment, segmentIndex (segmentIndex)}
        {#if segment.type === 'text'}
          <span>{segment.value}</span>
        {:else}
          {@const expected = correctAnswers[segment.index]?.trim()}
          <span
            class="ui:inline-flex ui:mx-0.5 ui:min-h-8 ui:min-w-[5rem] ui:items-center ui:justify-center ui:rounded ui:border-2 ui:border-solid ui:border-primary ui:bg-background ui:px-2 ui:py-0.5"
          >
            {expected || label('common.not_set')}
          </span>
        {/if}
      {/each}
    </div>
  {/if}
</div>
