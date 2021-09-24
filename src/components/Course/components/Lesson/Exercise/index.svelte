<script>
  import { onDestroy } from 'svelte';
  import AddAlt16 from 'carbon-icons-svelte/lib/AddAlt16';
  import {
    handleAddQuestion,
    questionnaire,
    validateQuestionnaire,
    reset,
  } from '../store/exercise';
  import PrimaryButton from '../../../../PrimaryButton/index.svelte';
  import PageBody from '../../../../PageBody/index.svelte';
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

  function onCancel() {
    mode = MODES.view;
    refetchExercise();
  }

  onDestroy(() => {
    reset();
  });
</script>

<PageBody>
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
        <PrimaryButton
          variant={preview ? VARIANTS.CONTAINED : VARIANTS.OUTLINED}
          label={'Toggle Preview'}
          onClick={() => (preview = !preview)}
        />
      {/if}
    </div>

    {#if mode === MODES.edit}
      <div class="flex items-center">
        <PrimaryButton variant={VARIANTS.OUTLINED} onClick={handleAddQuestion}>
          Add Question <AddAlt16 class="carbon-icon" />
        </PrimaryButton>
      </div>
    {/if}
  </svelte:fragment>

  {#if mode === MODES.edit && !preview}
    <EditMode />
  {:else}
    <ViewMode {preview} {exerciseId} />
  {/if}
</PageBody>
