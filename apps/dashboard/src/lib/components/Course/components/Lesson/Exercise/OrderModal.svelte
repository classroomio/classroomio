<script lang="ts">
  import { untrack } from 'svelte';
  import { dndzone } from 'svelte-dnd-action';
  import SquareCheckIcon from '@lucide/svelte/icons/square-check';
  import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
  import TablePropertiesIcon from '@lucide/svelte/icons/table-properties';

  import { flip } from 'svelte/animate';
  import * as Dialog from '@cio/ui/base/dialog';

  import { questionnaireOrder, questionnaire } from '../store/exercise';
  import { filterOutDeleted } from './functions';
  import { t } from '$lib/utils/functions/translations';

  const flipDurationMs = 300;

  interface Question {
    id: number;
    name: string;
    type: number;
  }

  let items: Array<Question> = $state([]);

  function setItemsFromQuestions(questions: typeof $questionnaire.questions) {
    untrack(() => {
      items = filterOutDeleted(questions).map((q) => ({
        id: q.id,
        name: q.title,
        type: q.question_type.id
      }));
    });
  }

  function handleDndConsider(e) {
    items = e.detail.items;
  }

  function handleDndFinalize(e) {
    items = e.detail.items;
  }

  function handleClose() {
    items.forEach((item, index) => {
      const order = index + 1;
      $questionnaire.questions.some((q) => {
        if (q.id === item.id) {
          q.is_dirty = true;
          q.order = order;
          return true;
        }
      });
    });
    $questionnaire.questions = $questionnaire.questions.sort((a, b) => a.order - b.order);
    $questionnaireOrder.open = false;
  }

  $effect(() => {
    setItemsFromQuestions($questionnaire.questions);
  });
</script>

<Dialog.Root
  bind:open={$questionnaireOrder.open}
  onOpenChange={(isOpen) => {
    if (!isOpen) handleClose();
  }}
>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.exercises.all_exercises.order_questions')}</Dialog.Title>
    </Dialog.Header>
    <section
    use:dndzone={{
      items,
      flipDurationMs,
      dropTargetStyle: {
        border: '2px #1d4ed8 solid',
        'border-style': 'dashed'
      }
    }}
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
    class="w-full"
  >
    {#each items as item (item.id)}
      <div
        animate:flip={{ duration: flipDurationMs }}
        class="border-primary-600 flex items-center rounded-md border p-4"
      >
        {#if item.type === 1}
          <SquareCheckIcon size={16} />
        {:else if item.type === 2}
          <CircleDotIcon size={16} />
        {:else}
          <TablePropertiesIcon size={16} />
        {/if}
        {` ${item.name}`}
      </div>
    {/each}
  </section>
  </Dialog.Content>
</Dialog.Root>

<style>
  section {
    padding: 0.3em;
    overflow: auto;
  }
  div {
    margin: 0.5em 0;
  }
</style>
