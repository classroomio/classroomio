<script>
  import PrimaryButton from '../../../../PrimaryButton/index.svelte';
  import PageBody from '../../../../PageBody/index.svelte';
  import Modal from '../../../../Modal/index.svelte';
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
          id: _lesson.exercises.length + 1,
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
    onClose={handleCancelAddExercise}
    bind:open
    modalHeading="Create an Exercise"
  >
    <TextField
      bind:value={newExercise.title}
      autofocus={true}
      placeholder="Exercise name"
    />

    <div class="mt-5 flex items-center">
      <PrimaryButton
        className="px-6 py-2"
        label="Submit"
        onClick={handleAddExercise}
      />
    </div>
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
        <a
          class="w-52 bg-gray-100 px-4 py-7 mr-4 mb-4"
          href="{path}/{exercise.id}"
        >
          <h3 class="text-xl">{exercise.title}</h3>
          <p class="mt-4 text-sm">Created Jul 3, 2021</p>
        </a>
      {/each}
    </div>
  </PageBody>
{/if}
