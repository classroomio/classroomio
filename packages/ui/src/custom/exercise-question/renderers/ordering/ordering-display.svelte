<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import { applyOrderingAnswer, areSameOrdering, getOrderingItemsFromQuestion } from '../ordering-utils';

  let { question, answer = null, labels }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  const expectedOrder = $derived.by(() => getOrderingItemsFromQuestion(question));
  const submittedOrder = $derived.by(() => applyOrderingAnswer(expectedOrder, answer));
  const hasSubmittedAnswer = $derived(answer?.type === 'ORDERING' ? answer.orderedValues.length > 0 : false);
  const isSubmittedOrderCorrect = $derived(areSameOrdering(expectedOrder, submittedOrder));

  function getRowClass(index: number): string {
    if (!hasSubmittedAnswer) return 'ui:border-muted';

    const expected = expectedOrder[index];
    const submitted = submittedOrder[index];
    const isMatch = expected && submitted ? expected.answerValue === submitted.answerValue : false;

    return isMatch ? 'ui:border-emerald-400 ui:bg-emerald-50/30' : 'ui:border-amber-400 ui:bg-amber-50/30';
  }
</script>

<div class="ui:space-y-3">
  {#if hasSubmittedAnswer}
    <div class="ui:space-y-1">
      <p class="ui:text-muted-foreground ui:text-xs">{label('ordering.preview.submitted_label')}</p>
      {#each submittedOrder as item, index (item.id)}
        <div class={`ui:flex ui:items-center ui:gap-3 ui:rounded-md ui:border ui:p-2 ${getRowClass(index)}`}>
          <span class="ui:bg-muted ui:text-muted-foreground ui:rounded-full ui:px-2 ui:py-1 ui:text-xs"
            >{index + 1}</span
          >
          <span class="ui:text-sm">{item.label}</span>
        </div>
      {/each}
    </div>

    <p class={`ui:text-xs ${isSubmittedOrderCorrect ? 'ui:text-emerald-600' : 'ui:text-amber-600'}`}>
      {isSubmittedOrderCorrect ? label('ordering.preview.matches') : label('ordering.preview.differs')}
    </p>
  {/if}

  <div class="ui:space-y-1">
    <p class="ui:text-muted-foreground ui:text-xs">{label('ordering.preview.expected_label')}</p>
    {#each expectedOrder as item, index (item.id)}
      <div class="ui:bg-background ui:flex ui:items-center ui:gap-3 ui:rounded-md ui:border ui:p-2">
        <span class="ui:bg-muted ui:text-muted-foreground ui:rounded-full ui:px-2 ui:py-1 ui:text-xs">{index + 1}</span>
        <span class="ui:text-sm">{item.label}</span>
      </div>
    {/each}
  </div>
</div>
