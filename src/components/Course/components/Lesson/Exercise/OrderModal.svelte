<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import CheckboxCheckedFilled16 from 'carbon-icons-svelte/lib/CheckboxCheckedFilled16';
  import RadioButtonChecked16 from 'carbon-icons-svelte/lib/RadioButtonChecked16';
  import TextAlignJustify16 from 'carbon-icons-svelte/lib/TextAlignJustify16';

  import { flip } from 'svelte/animate';
  import Modal from '../../../../Modal/index.svelte';

  import { questionnaireOrder, questionnaire } from '../store/exercise';
  import { filterOutDeleted } from './functions';

  const flipDurationMs = 300;

  interface Question {
    id: number;
    name: string;
    type: number;
  }

  let items: Array<Question> = [];

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
    $questionnaire.questions = $questionnaire.questions.sort(
      (a, b) => a.order - b.order
    );
    $questionnaireOrder.open = false;
  }

  $: items = filterOutDeleted($questionnaire.questions).map((q) => ({
    id: q.id,
    name: q.title,
    type: q.question_type.id,
  }));
</script>

<Modal
  onClose={handleClose}
  bind:open={$questionnaireOrder.open}
  width="w-96"
  modalHeading="Order questions"
>
  <section
    use:dndzone={{
      items,
      flipDurationMs,
      dropTargetStyle: {
        border: '2px #1d4ed8 solid',
        'border-style': 'dashed',
      },
    }}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
    class="w-full"
  >
    {#each items as item (item.id)}
      <div
        animate:flip={{ duration: flipDurationMs }}
        class="flex items-center rounded-md p-4 border border-blue-600"
      >
        {#if item.type === 1}
          <RadioButtonChecked16 class="carbon-icon active" />
        {:else if item.type === 2}
          <CheckboxCheckedFilled16 class="carbon-icon active" />
        {:else}
          <TextAlignJustify16 class="carbon-icon active" />
        {/if}
        {` ${item.name}`}
      </div>
    {/each}
  </section>
</Modal>

<style>
  section {
    padding: 0.3em;
    overflow: auto;
  }
  div {
    margin: 0.5em 0;
  }
</style>
