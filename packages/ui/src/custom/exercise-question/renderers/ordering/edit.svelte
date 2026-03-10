<script lang="ts">
  import {
    getExerciseQuestionLabel,
    type ExerciseQuestionModel,
    type ExerciseQuestionRendererProps
  } from '@cio/question-types';
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { Button } from '../../../../base/button';
  import { Input } from '../../../../base/input';
  import { IconButton } from '../../../icon-button';
  import {
    getOrderingItemsFromQuestion,
    toOrderingQuestionOptions,
    toOrderingSettings,
    type OrderingRenderItem
  } from '../ordering-utils';

  const flipDurationMs = 150;

  let { question, disabled = false, labels, onQuestionChange = () => {} }: ExerciseQuestionRendererProps = $props();
  const label = (key: Parameters<typeof getExerciseQuestionLabel>[1], fallback = '') =>
    getExerciseQuestionLabel(labels, key, fallback);

  let items = $state<OrderingRenderItem[]>([]);
  let lastSyncedSignature = $state('');

  function patchQuestion(partial: Partial<ExerciseQuestionModel>) {
    onQuestionChange({ ...question, ...partial });
  }

  function createItemId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-ordering-item`;
  }

  function normalizeItemIds(nextItems: OrderingRenderItem[]): OrderingRenderItem[] {
    return nextItems.map((item) => {
      const normalizedId = item.id || createItemId();
      return {
        ...item,
        id: normalizedId,
        answerValue: item.answerValue || normalizedId
      };
    });
  }

  function syncQuestionWithItems(nextItems: OrderingRenderItem[]) {
    const normalizedItems = normalizeItemIds(nextItems);
    items = normalizedItems;
    lastSyncedSignature = getItemsSignature(normalizedItems);

    patchQuestion({
      options: toOrderingQuestionOptions(normalizedItems),
      settings: {
        ...(question.settings ?? {}),
        items: toOrderingSettings(normalizedItems)
      }
    });
  }

  function getItemsSignature(nextItems: OrderingRenderItem[]): string {
    return JSON.stringify(nextItems.map((item) => ({ id: item.id, label: item.label, answerValue: item.answerValue })));
  }

  function hydrateFromQuestion() {
    const nextItems = getOrderingItemsFromQuestion(question);
    const signature = getItemsSignature(nextItems);
    if (signature === lastSyncedSignature) return;

    items = nextItems;
    lastSyncedSignature = signature;
  }

  function handleDndConsider(event: CustomEvent<{ items: OrderingRenderItem[] }>) {
    items = event.detail.items;
  }

  function handleDndFinalize(event: CustomEvent<{ items: OrderingRenderItem[] }>) {
    syncQuestionWithItems(event.detail.items);
  }

  function updateItemLabel(id: string, label: string) {
    const nextItems = items.map((item) =>
      item.id === id ? { ...item, label, answerValue: item.answerValue || item.id } : item
    );
    syncQuestionWithItems(nextItems);
  }

  function addItem() {
    const nextId = createItemId();
    syncQuestionWithItems([
      ...items,
      {
        id: nextId,
        label: '',
        answerValue: nextId
      }
    ]);
  }

  function removeItem(id: string) {
    syncQuestionWithItems(items.filter((item) => item.id !== id));
  }

  function formatStepPlaceholder(index: number): string {
    const template = label('ordering.edit.step_placeholder');
    if (!template) return String(index + 1);
    return template.replace('{index}', String(index + 1));
  }

  $effect(() => {
    hydrateFromQuestion();
  });
</script>

<div class="ui:space-y-3">
  <div class="ui:flex ui:items-center ui:justify-between">
    <p class="ui:text-muted-foreground ui:text-xs">{label('ordering.edit.helper')}</p>
    <Button variant="outline" size="sm" type="button" {disabled} onclick={addItem}>
      <PlusIcon class="ui:size-4" />
      {label('ordering.edit.add_step')}
    </Button>
  </div>

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
        {label('ordering.edit.empty')}
      </div>
    {:else}
      {#each items as item, index (item.id)}
        <div
          animate:flip={{ duration: flipDurationMs }}
          class="ui:bg-background ui:flex ui:items-center ui:gap-2 ui:rounded-md ui:border ui:p-2"
        >
          <div class="ui:text-muted-foreground ui:flex ui:cursor-grab ui:items-center">
            <GripVerticalIcon class="ui:size-4" />
          </div>
          <span
            class="ui:bg-muted ui:text-muted-foreground ui:flex ui:h-6 ui:w-6 ui:items-center ui:justify-center ui:rounded-full ui:text-xs"
          >
            {index + 1}
          </span>
          <Input
            class="ui:flex-1"
            value={item.label}
            {disabled}
            placeholder={formatStepPlaceholder(index)}
            onchange={(event) => updateItemLabel(item.id, event.currentTarget.value)}
          />
          <IconButton
            type="button"
            {disabled}
            tooltip={label('ordering.edit.remove_step_tooltip')}
            class="ui:text-muted-foreground"
            onclick={() => removeItem(item.id)}
          >
            <Trash2Icon class="ui:size-4" />
          </IconButton>
        </div>
      {/each}
    {/if}
  </section>
</div>
