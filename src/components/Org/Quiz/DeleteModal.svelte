<script>
  import PrimaryButton from '../../PrimaryButton/index.svelte';
  import { VARIANTS } from '../../PrimaryButton/constants';
  import Modal from '../../Modal/index.svelte';
  import { deleteModal, quizesStore } from '../../../utils/store/org';
  import { supabase } from '../../../utils/functions/supabase';

  export let onDelete = () => {};

  function closeModal() {
    deleteModal.update((m) => ({
      ...m,
      open: false,
      id: null,
      isQuestion: false,
    }));
  }

  async function deleteQuiz() {
    const { data, error } = await supabase
      .from('quiz')
      .delete()
      .match({ id: $deleteModal.id });
    console.log('data', data);
    console.log('error', error);

    if (error) {
      return;
    }

    $quizesStore = $quizesStore.filter((q) => q.id !== $deleteModal.id);
    closeModal();
  }
</script>

<Modal
  onClose={closeModal}
  bind:open={$deleteModal.open}
  width="w-2/5"
  modalHeading={$deleteModal.isQuestion ? 'Delete Question' : 'Delete Quiz'}
  size="sm"
>
  <div class="w-full flex flex-col items-center my-10">
    <h1 class="dark:text-white text-lg text-center">
      {#if $deleteModal.isQuestion}
        Are you sure you want to delete this question?
      {:else}
        Are you sure you want to delete this quiz?
      {/if}
      You will lose your content and this action can’t be undone.
    </h1>

    <div class="mt-5">
      <PrimaryButton
        className="px-6 py-3"
        variant={VARIANTS.CONTAINED_DANGER}
        label="Delete"
        onClick={() => {
          if ($deleteModal.isQuestion) {
            onDelete();
            $deleteModal.open = false;
          } else {
            deleteQuiz();
          }
        }}
      />
    </div>
  </div>
</Modal>
