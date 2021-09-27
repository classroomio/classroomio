<script>
  import { onDestroy } from 'svelte';
  import AddAlt24 from 'carbon-icons-svelte/lib/AddAlt24';
  import Delete24 from 'carbon-icons-svelte/lib/Delete24';
  import Settings24 from 'carbon-icons-svelte/lib/Settings24';
  import View32 from 'carbon-icons-svelte/lib/View32';
  import ViewFilled32 from 'carbon-icons-svelte/lib/ViewFilled32';
  import {
    handleAddQuestion,
    questionnaire,
    validateQuestionnaire,
    reset,
  } from '../store/exercise';
  import PrimaryButton from '../../../../PrimaryButton/index.svelte';
  import PageBody from '../../../../PageBody/index.svelte';
  import IconButton from '../../../../IconButton/index.svelte';
  import RoleBasedSecurity from '../../../../RoleBasedSecurity/index.svelte';
  import ViewMode from './ViewMode.svelte';
  import EditMode from './EditMode.svelte';
  import MODES from '../../../../../utils/constants/mode.js';
  import { VARIANTS } from '../../../../PrimaryButton/constants';
  import { upsertExercise } from '../../../../../utils/services/courses';

  export let exerciseId;
  export let refetchExercise = () => {};

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
        questions: updatedQuestions,
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
      <RoleBasedSecurity allowedRoles="[1,2]">
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
            <ViewFilled32 class="carbon-icon" />
          {:else}
            <View32 class="carbon-icon" />
          {/if}
        </IconButton>
      {/if}
    </div>

    {#if mode === MODES.edit}
      <div class="flex items-center">
        <IconButton
          onClick={() => (editDescription = true)}
          toolTipProps={{ title: 'Edit description', direction: 'bottom' }}
        >
          <Settings24 class="carbon-icon" />
        </IconButton>
        <!-- <IconButton
          onClick={handleDeleteExercise}
          toolTipProps={{ title: 'Delete questionnaire', direction: 'bottom' }}
        >
          <Delete24 class="carbon-icon" />
        </IconButton> -->

        <IconButton
          onClick={handleAddQuestion}
          toolTipProps={{ title: 'Add question', direction: 'bottom' }}
        >
          <AddAlt24 class="carbon-icon" />
        </IconButton>
      </div>
    {/if}
  </svelte:fragment>

  {#if mode === MODES.edit && !preview}
    <EditMode bind:editDescription />
  {:else}
    <ViewMode {preview} {exerciseId} />
  {/if}
</PageBody>
