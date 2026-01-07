<script>
  import { preventDefault } from '$lib/utils/functions/svelte';

  import { goto } from '$app/navigation';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { InputField } from '@cio/ui/custom/input-field';
  import { snackbar } from '$features/ui/snackbar/store';
  import { quizApi } from '$features/org/api/quiz.svelte';
  import { currentOrg, createQuizModal, currentOrgPath } from '$lib/utils/store/org';
  import { createQuizValidation } from '$lib/utils/functions/validator';
  import { t } from '$lib/utils/functions/translations';

  let open = $state(false);
  let errors = $state({
    title: ''
  });
  let isLoading = $state(false);

  function handleClose() {
    $createQuizModal.id = null;
    $createQuizModal.title = '';
    $createQuizModal.open = false;
    $createQuizModal.openEdit = false;
  }

  function errorNotification() {
    snackbar.error();
  }

  async function createQuiz() {
    errors = createQuizValidation($createQuizModal);
    console.log('createQuiz|updateQuiz errors', errors);

    if (Object.keys(errors).length) {
      return;
    }

    isLoading = true;
    if ($createQuizModal.openEdit && $createQuizModal.id) {
      await quizApi.update($currentOrg.id, $createQuizModal.id, {
        title: $createQuizModal.title
      });

      isLoading = false;

      if (quizApi.success) {
        // quizApi.quizzes is already updated by the API
        handleClose();
      } else {
        return errorNotification();
      }
    } else {
      const newQuiz = await quizApi.create($currentOrg.id, {
        title: $createQuizModal.title,
        questions: [
          {
            id: 1,
            label: '',
            type: 'multichoice',
            options: [
              {
                id: 'circle',
                label: '',
                isCorrect: false
              },
              {
                id: 'triangle',
                label: '',
                isCorrect: false
              }
            ]
          }
        ]
      });

      isLoading = false;

      if (quizApi.success && newQuiz) {
        // quizApi.quizzes is already updated by the API
        handleClose();
        goto(`${$currentOrgPath}/quiz/${newQuiz.id}`);
      } else {
        return errorNotification();
      }
    }
  }

  $effect(() => {
    open = $createQuizModal.openEdit || $createQuizModal.open;
  });
</script>

<svelte:head>
  <title>{$t('components.quiz.title')} - ClassroomIO</title>
</svelte:head>

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen) handleClose();
  }}
>
  <Dialog.Content class="w-4/5 md:w-2/5">
    <Dialog.Header>
      <Dialog.Title>
        {$createQuizModal.openEdit ? $t('components.quiz.update') : $t('components.quiz.create')}
        {$t('components.quiz.a_quiz')}
      </Dialog.Title>
    </Dialog.Header>
    <form onsubmit={preventDefault(createQuiz)}>
      <InputField
        label={$t('components.quiz.quiz_title')}
        bind:value={$createQuizModal.title}
        autofocus={true}
        placeholder={$t('components.quiz.placehoolder')}
        className="mb-4"
        isRequired={true}
        errorMessage={errors.title}
        autoComplete={false}
      />

      <div class="mt-5 flex items-center justify-end">
        <Button type="submit" disabled={isLoading} loading={isLoading}>
          {$createQuizModal.openEdit ? $t('components.quiz.save') : $t('components.quiz.continue')}
        </Button>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>
