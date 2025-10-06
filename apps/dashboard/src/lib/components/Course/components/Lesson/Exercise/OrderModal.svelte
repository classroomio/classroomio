<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import CheckboxCheckedFilledIcon from 'carbon-icons-svelte/lib/CheckboxCheckedFilled.svelte';
  import RadioButtonCheckedIcon from 'carbon-icons-svelte/lib/RadioButtonChecked.svelte';
  import TextAlignJustifyIcon from 'carbon-icons-svelte/lib/TextAlignJustify.svelte';

  import { flip } from 'svelte/animate';
  import Modal from '$lib/components/Modal/index.svelte';

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
    items = filterOutDeleted($questionnaire.questions).map((q) => ({
      id: q.id,
      name: q.title,
      type: q.question_type.id
    }));
  });
</script>

<Modal
  onClose={handleClose}
  bind:open={$questionnaireOrder.open}
  width="w-96"
  modalHeading={$t('course.navItem.lessons.exercises.all_exercises.order_questions')}
>
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
          <RadioButtonCheckedIcon size={16} class="carbon-icon active" />
        {:else if item.type === 2}
          <CheckboxCheckedFilledIcon size={16} class="carbon-icon active" />
        {:else}
          <TextAlignJustifyIcon size={16} class="carbon-icon active" />
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
