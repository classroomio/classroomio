<script>
  import { Modal } from 'carbon-components-svelte';
  import PrimaryButton from '../../../../PrimaryButton/index.svelte';
  import PageBody from '../../../../PageBody/index.svelte';
  import TextField from '../../../../Form/TextField.svelte';
  import Exercise from '../Exercise/index.svelte';

  import { lesson } from '../store/lessons';

  export let path;
  export let exerciseId;

  let open = false;
  let newExercise = {
    id: 1,
    title: '',
    link: '',
  };

  function handleAddExercise() {
    lesson.update((_lesson) => ({
      ..._lesson,
      exercises: [
        ..._lesson.exercises,
        {
          ...newExercise,
          link: `${path}/${_lesson.exercises.length + 1}`,
        },
      ],
    }));

    handleCancelAddExercise();
  }

  function handleCancelAddExercise() {
    open = false;
    newExercise = {
      id: $lesson.exercises.length + 1,
      title: '',
      link: '',
    };
  }
</script>

{#if exerciseId}
  <Exercise {exerciseId} />
{:else}
  <Modal
    size="xs"
    bind:open
    modalHeading="Create an Exercise"
    primaryButtonText="Confirm"
    secondaryButtonText="Cancel"
    on:click:button--primary={handleAddExercise}
    on:click:button--secondary={handleCancelAddExercise}
    on:open
    on:close
    on:submit
  >
    <TextField
      bind:value={newExercise.title}
      autofocus={true}
      placeholder="Exercise name"
    />
  </Modal>

  <PageBody width="w-11/12 m-auto">
    <slot:fragment slot="header">
      <PrimaryButton
        className="mr-2"
        label="Add"
        onClick={() => (open = !open)}
      />
    </slot:fragment>

    <div class="flex flex-wrap">
      {#each $lesson.exercises as exercise}
        <a class="w-52 bg-gray-100 px-4 py-7 mr-4 mb-4" href={exercise.link}>
          <h3 class="text-xl">{exercise.title}</h3>
          <p class="mt-4 text-sm">Created Jul 3, 2021</p>
        </a>
      {/each}
    </div>
  </PageBody>
{/if}
