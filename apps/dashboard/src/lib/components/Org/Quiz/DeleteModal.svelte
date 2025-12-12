<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import Modal from '$lib/components/Modal/index.svelte';
  import { deleteModal, quizesStore } from '$lib/utils/store/org';
  import { supabase } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';

  let { onDelete = () => {} } = $props();

  function closeModal() {
    deleteModal.update((m) => ({
      ...m,
      open: false,
      id: null,
      isQuestion: false
    }));
  }

  async function deleteQuiz() {
    const { data, error } = await supabase.from('quiz').delete().match({ id: $deleteModal.id });
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
  modalHeading={$deleteModal.isQuestion ? $t('components.quiz.question_delete') : $t('components.quiz.quiz_delete')}
  size="sm"
>
  <div class="my-10 flex w-full flex-col items-center">
    <h1 class="text-center text-lg dark:text-white">
      {#if $deleteModal.isQuestion}
        {$t('components.quiz.delete_question')}
      {:else}
        {$t('components.quiz.delete_quiz')}
      {/if}
      {$t('components.quiz.lose_content')}
    </h1>

    <div class="mt-5">
      <Button
        onclick={() => {
          if ($deleteModal.isQuestion) {
            onDelete();
            $deleteModal.open = false;
          } else {
            deleteQuiz();
          }
        }}
      >
        {$t('components.quiz.delete')}
      </Button>
    </div>
  </div>
</Modal>
