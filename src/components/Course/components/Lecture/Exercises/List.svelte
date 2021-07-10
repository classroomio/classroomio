<script>
  import { Modal } from "carbon-components-svelte";
  import PrimaryButton from "../../../../PrimaryButton/index.svelte";
  import PageBody from "../../../../PageBody/index.svelte";
  import TextField from "../../../../Form/TextField.svelte";

  export let path;

  let exercises = [
    {
      id: 1,
      title: "Practice Exercise",
      link: `${path}&exerciseId=1`,
    },
    {
      id: 2,
      title: "Home task",
      link: `${path}&exerciseId=2`,
    },
  ];
  let exerciseEditing;
  let open = false;
  let newExercise = {
    id: 1,
    title: "",
    link: "",
  };

  function handleAddExercise() {
    open = true;
  }
</script>

<Modal
  size="sm"
  bind:open
  modalHeading="Create database"
  primaryButtonText="Confirm"
  secondaryButtonText="Cancel"
  on:click:button--secondary
  on:open
  on:close
  on:submit
>
  <p>Create a new Cloudant database in the US South region.</p>
</Modal>

<PageBody width="w-11/12 m-auto">
  <slot:fragment slot="header">
    <PrimaryButton className="mr-2" label="Add" onClick={handleAddExercise} />
  </slot:fragment>

  <div class="flex flex-wrap">
    {#each exercises as exercise, index}
      <a class="w-52 bg-gray-100 px-4 py-7 mr-4 mb-4" href={exercise.link}>
        {#if exerciseEditing === index}
          <TextField bind:value={exercise.title} autofocus={true} />
        {:else}
          <h3 class="text-xl">{exercise.title}</h3>
        {/if}

        <p class="mt-4 text-sm">Created Jul 3, 2021</p>
      </a>
    {/each}
  </div>
</PageBody>
