<script>
  import { onDestroy } from 'svelte';
  import AddAltIcon from 'carbon-icons-svelte/lib/AddAlt.svelte';
  import TableIcon from 'carbon-icons-svelte/lib/Table.svelte';
  import SettingsIcon from 'carbon-icons-svelte/lib/Settings.svelte';
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
  import MODES from '$lib/utils/constants/mode.js';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { upsertExercise } from '$lib/utils/services/courses';

  export let exerciseId;
  export let refetchExercise = () => {};
  export let goBack = () => {};

  let mode = MODES.view;
  let preview = false;
  let editDescription = false;

  async function handleMode() {
    if (mode === MODES.edit) {
      const errors = validateQuestionnaire($questionnaire.questions);
      if (Object.values(errors).length > 0) {
        return;
      }

      mode = MODES.view;

      reset();

      const updatedQuestions = await upsertExercise($questionnaire, exerciseId);

      questionnaire.update((q) => ({
        ...q,
        is_title_dirty: false,
        is_description_dirty: false,
        questions: updatedQuestions
      }));
    } else {
      mode = MODES.edit;
      preview = false;
    }
  }

  function handleDeleteExercise() {}

  function onCancel() {
    mode = MODES.view;
    refetchExercise();
  }

  onDestroy(() => {
    reset();
  });
</script>

<PageBody padding="px-4">
  <svelte:fragment slot="header">
    <div class="flex items-center">
      <RoleBasedSecurity allowedRoles={[1, 2]}>
        <PrimaryButton
          className="mr-2"
          variant={VARIANTS.CONTAINED}
          label={mode === MODES.edit ? 'Save' : 'Edit'}
          onClick={handleMode}
        />
        {#if mode === MODES.edit}
          <PrimaryButton
            className="mr-2"
            variant={VARIANTS.OUTLINED}
            label={'Cancel'}
            onClick={onCancel}
          />
        {/if}
      </RoleBasedSecurity>

      {#if mode !== MODES.edit}
        <IconButton
          onClick={() => (preview = !preview)}
          toolTipProps={{ title: 'Toggle preview', direction: 'right' }}
          selected={preview}
          contained={true}
        >
          {#if preview}
            <ViewFilledIcon size={32} class="carbon-icon dark:text-white" />
          {:else}
            <ViewIcon size={32} class="carbon-icon dark:text-white" />
          {/if}
        </IconButton>
      {/if}
    </div>

    {#if mode === MODES.edit}
      <div class="flex items-center">
        <IconButton
          onClick={handleAddQuestion}
          toolTipProps={{ title: 'Add question', direction: 'bottom' }}
        >
          <AddAltIcon size={32} class="carbon-icon dark:text-white" />
        </IconButton>
        <IconButton
          onClick={() => ($questionnaireOrder.open = true)}
          toolTipProps={{ title: 'Order questionnaire', direction: 'bottom' }}
        >
          <TableIcon size={32} class="carbon-icon dark:text-white" />
        </IconButton>
        <IconButton
          onClick={() => (editDescription = true)}
          toolTipProps={{ title: 'Edit description', direction: 'bottom' }}
        >
          <SettingsIcon size={32} class="carbon-icon dark:text-white" />
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

  {#if mode === MODES.edit && !preview}
    <EditMode bind:editDescription {exerciseId} {goBack} />
  {:else}
    <ViewMode {preview} {exerciseId} />
  {/if}
</PageBody>
