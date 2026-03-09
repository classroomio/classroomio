<script lang="ts">
  import { getExerciseQuestionLabel, type ExerciseQuestionRendererProps } from '@cio/question-types';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { applyOrderingAnswer, getOrderingItemsFromQuestion, type OrderingRenderItem } from '../ordering-utils';

  const flipDurationMs = 150;

  let {
    question,
    answer,
    disabled = false,
    labels,
    onAnswerChange = () => {}
  }: ExerciseQuestionRendererProps = $props();

  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  let items = $state<OrderingRenderItem[]>([]);
  let signature = $state('');

  function toSignature(nextItems: OrderingRenderItem[]): string {
    return JSON.stringify(nextItems.map((item) => ({ id: item.id, label: item.label, answerValue: item.answerValue })));
  }

  function hydrateFromQuestionAndAnswer() {
    const sourceItems = getOrderingItemsFromQuestion(question);
    const sortedItems = applyOrderingAnswer(sourceItems, answer);
    const nextSignature = toSignature(sortedItems);

    if (nextSignature === signature) return;

    items = sortedItems;
    signature = nextSignature;
  }

  function syncAnswer(nextItems: OrderingRenderItem[]) {
    items = nextItems;
    signature = toSignature(nextItems);
    onAnswerChange({ type: 'ORDERING', orderedValues: nextItems.map((item) => item.answerValue) });
  }

  function handleDndConsider(event: CustomEvent<{ items: OrderingRenderItem[] }>) {
    items = event.detail.items;
  }

  function handleDndFinalize(event: CustomEvent<{ items: OrderingRenderItem[] }>) {
    syncAnswer(event.detail.items);
  }

  $effect(() => {
    hydrateFromQuestionAndAnswer();
  });
</script>

<div class="ui:space-y-2">
  <p class="ui:text-muted-foreground ui:text-xs">{label('ordering.take.helper')}</p>

  <section
    class="ui:space-y-2"
    use:dndzone={{
      items,
      flipDurationMs,
      dragDisabled: disabled,
      dropTargetStyle: {
        border: '2px #1d4ed8 solid',
        'border-style': 'dashed',
        'border-radius': '0.5rem'
      }
    }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
  >
    {#if items.length === 0}
      <div class="ui:text-muted-foreground ui:rounded-md ui:border ui:border-dashed ui:p-4 ui:text-sm">
        {label('ordering.take.empty')}
      </div>
    {:else}
      {#each items as item, index (item.id)}
        <div
          animate:flip={{ duration: flipDurationMs }}
          class="ui:bg-background ui:flex ui:items-center ui:gap-3 ui:rounded-md ui:border ui:p-3"
        >
          <GripVerticalIcon class="ui:text-muted-foreground ui:size-4" />
          <span class="ui:bg-muted ui:text-muted-foreground ui:rounded-full ui:px-2 ui:py-1 ui:text-xs"
            >{index + 1}</span
          >
          <p class="ui:text-sm">{item.label}</p>
        </div>
      {/each}
    {/if}
  </section>
</div>
