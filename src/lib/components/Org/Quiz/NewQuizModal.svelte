<script>
  import { goto } from '$app/navigation';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { supabase } from '$lib/utils/functions/supabase';
  import { currentOrg, createQuizModal, currentOrgPath, quizesStore } from '$lib/utils/store/org';
  import { createQuizValidation } from '$lib/utils/functions/validator';

  let open = false;
  let errors = {
    title: ''
  };
  let isLoading = false;

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
    if ($createQuizModal.openEdit) {
      const { error } = await supabase
        .from('quiz')
        .update({ title: $createQuizModal.title, updated_at: new Date() })
        .match({ id: $createQuizModal.id });

      isLoading = false;

      if (error) {
        return errorNotification();
      } else {
        $quizesStore = $quizesStore.map((s) => {
          if (s.id === $createQuizModal.id) {
            s.title = $createQuizModal.title;
          }
          return s;
        });
        handleClose();
      }
    } else {
      const { data, error } = await supabase
        .from('quiz')
        .insert({
          title: $createQuizModal.title,
          organization_id: $currentOrg.id,
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
        })
        .select();
      isLoading = false;

      if (error) {
        return errorNotification();
      } else {
        $quizesStore = [...$quizesStore, data[0]];

        handleClose();
        goto(`${$currentOrgPath}/quiz/${data[0].id}`);
      }
    }
  }

  $: open = $createQuizModal.openEdit || $createQuizModal.open;
</script>

<svelte:head>
  <title>Quizzes - ClassroomIO</title>
</svelte:head>

<Modal
  onClose={handleClose}
  bind:open
  width="w-4/5 md:w-2/5"
  modalHeading="{$createQuizModal.openEdit ? 'Update' : 'Create'} a Quiz"
>
  <form on:submit|preventDefault={createQuiz}>
    <TextField
      label="Quiz Title"
      bind:value={$createQuizModal.title}
      autofocus={true}
      placeholder="Your quiz title"
      className="mb-4"
      isRequired={true}
      errorMessage={errors.title}
      autoComplete={false}
    />

    <div class="mt-5 flex items-center justify-end">
      <PrimaryButton
        className="px-6 py-3"
        label={$createQuizModal.openEdit ? 'Save Changes' : 'Continue'}
        type="submit"
        isDisabled={isLoading}
        {isLoading}
      />
    </div>
  </form>
</Modal>
