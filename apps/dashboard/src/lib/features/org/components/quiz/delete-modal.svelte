<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { deleteModal, currentOrg } from '$lib/utils/store/org';
  import { quizApi } from '$features/org/api/quiz.svelte';
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
    if (!$currentOrg.id || !$deleteModal.id) return;

    await quizApi.delete($currentOrg.id, $deleteModal.id);

    if (quizApi.success) {
      // quizApi.quizzes is already updated by the API
      closeModal();
    }
  }
</script>

<Dialog.Root
  bind:open={$deleteModal.open}
  onOpenChange={(isOpen) => {
    if (!isOpen) closeModal();
  }}
>
  <Dialog.Content class="w-2/5 max-w-[388px]">
    <Dialog.Header>
      <Dialog.Title>
        {$deleteModal.isQuestion ? $t('components.quiz.question_delete') : $t('components.quiz.quiz_delete')}
      </Dialog.Title>
    </Dialog.Header>
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
  </Dialog.Content>
</Dialog.Root>
