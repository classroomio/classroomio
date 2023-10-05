<script>
  import { onDestroy } from 'svelte';
  import AddAltIcon from 'carbon-icons-svelte/lib/AddAlt.svelte';
  import TableIcon from 'carbon-icons-svelte/lib/Table.svelte';
  import ViewIcon from 'carbon-icons-svelte/lib/View.svelte';
  import ViewFilledIcon from 'carbon-icons-svelte/lib/ViewFilled.svelte';
  import {
    handleAddQuestion,
    questionnaire,
    validateQuestionnaire,
    reset,
    questionnaireOrder
  } from '../store/exercise';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import PageBody from '$lib/components/PageBody/index.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import RoleBasedSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import ViewMode from './ViewMode.svelte';
  import EditMode from './EditMode.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { upsertExercise } from '$lib/utils/services/courses';
  import UpdateDescription from './UpdateDescription.svelte';
  import { TrashCan } from 'carbon-icons-svelte';
  import { exerciseMode } from './store';
  import { snackbar } from '$lib/components/Snackbar/store';

  export let exerciseId;
  export let goBack = () => {};
  export let isStudent = true;

  let preview = false;
  let editDescription = false;
  let isSaving = false;

  async function handleSave() {
    if ($exerciseMode.editMode) {
      const errors = validateQuestionnaire($questionnaire.questions);
      if (Object.values(errors).length > 0) {
        return;
      }
      isSaving = true;
      // $exerciseMode.mode = MODES.view;

      reset();
      try {
        const updatedQuestions = await upsertExercise($questionnaire, exerciseId);

        questionnaire.update((q) => ({
          ...q,
          is_title_dirty: false,
          is_description_dirty: false,
          questions: updatedQuestions
        }));
        snackbar.success('Saved Successfully');
      } catch (error) {
        console.error(error);
        snackbar.error();
      }
      isSaving = false;
    }
  }

  onDestroy(() => {
    reset();
  });

  $: $questionnaire.questions.length < 1 && handleAddQuestion();
</script>

<PageBody
  bind:isPageNavHidden={isStudent}
  padding="px-4 overflow-x-hidden"
  headerClassName="bg-gray-100 rounded-md mb-3"
>
  <svelte:fragment slot="header">
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <div class="flex items-center py-2 w-">
        {#if $exerciseMode.editMode}
          <PrimaryButton
            className="mr-2"
            variant={VARIANTS.CONTAINED}
            label={'Save'}
            onClick={handleSave}
            isLoading={isSaving}
          />
        {/if}
        {#if $exerciseMode.editMode}
          <IconButton
            onClick={() => (preview = !preview)}
            toolTipProps={{ title: 'Toggle preview', direction: 'right' }}
            selected={preview}
            contained={true}
            size="small"
          >
            {#if preview}
              <ViewFilledIcon size={24} class="carbon-icon dark:text-white" />
            {:else}
              <ViewIcon size={24} class="carbon-icon dark:text-white" />
            {/if}
          </IconButton>
        {/if}
      </div>
    </RoleBasedSecurity>

    {#if $exerciseMode.editMode}
      <div class="flex items-center">
        <IconButton
          onClick={() => handleAddQuestion()}
          toolTipProps={{ title: 'Add question', direction: 'bottom' }}
          size="small"
        >
          <AddAltIcon size={24} class="carbon-icon dark:text-white" />
        </IconButton>
        <IconButton
          onClick={() => ($questionnaireOrder.open = true)}
          toolTipProps={{ title: 'Order questionnaire', direction: 'bottom' }}
          size="small"
        >
          <TableIcon size={24} class="carbon-icon dark:text-white" />
        </IconButton>
        <IconButton
          onClick={() => (editDescription = true)}
          toolTipProps={{ title: 'Delete Exercise', direction: 'bottom' }}
          size="small"
        >
          <TrashCan size={24} class="carbon-icon dark:text-white" />
        </IconButton>

        <!-- <IconButton
              onClick={handleDeleteExercise}
              toolTipProps={{ title: 'Delete questionnaire', direction: 'bottom' }}
            >
              <Delete32 class="carbon-icon dark:text-white" />
            </IconButton> -->
      </div>
    {/if}
  </svelte:fragment>

  {#if $exerciseMode.editMode}
    <UpdateDescription {preview} {exerciseId} />
  {/if}
  {#if $exerciseMode.editMode && !preview}
    <EditMode bind:editDescription {exerciseId} {goBack} />
  {:else}
    <ViewMode {preview} {exerciseId} />
  {/if}
</PageBody>
