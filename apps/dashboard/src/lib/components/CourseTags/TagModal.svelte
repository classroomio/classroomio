<script lang="ts">
  import { currentOrg } from '$lib/utils/store/org';
  import { tagModal, tags, selectedTag } from './store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { createTag, deleteTag, updateTag } from '$lib/utils/services/courses';

  import Modal from '$lib/components/Modal/index.svelte';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  let name = '';
  let description = '';
  let isLoading = false;

  function resetStore() {
    $tagModal.editMode = false;
    $tagModal.deleteMode = false;
    $selectedTag = {
      name: '',
      description: ''
    };
    name = '';
    description = '';
    $tagModal.open = false;
  }

  const handleCreateTag = async () => {
    isLoading = true;
    const response = await createTag(name, description, $currentOrg.id);

    if (response.status === 201 && response.data) {
      tags.update((currentTags) => [...currentTags, response.data[0]]);
      resetStore();
    }
    isLoading = false;
  };

  const handleEditTag = async () => {
    isLoading = true;
    const response = await updateTag($selectedTag.id, $selectedTag.name, $selectedTag.description);

    if (response.status === 204) {
      tags.update((currentTags) =>
        currentTags.map((tag) =>
          tag.id === $selectedTag.id
            ? { ...tag, name: $selectedTag.name, description: $selectedTag.description }
            : tag
        )
      );
      resetStore();
    }
    isLoading = false;
  };

  const handleDeleteTag = async () => {
    isLoading = true;
    const response = await deleteTag($selectedTag.id);

    if (response.status === 200) {
      tags.update((currentTags) => currentTags.filter((tag) => tag.id !== $selectedTag.id));
      resetStore();
    }
    isLoading = false;
  };

  const handleSave = async () => {
    if ($tagModal.editMode) {
      await handleEditTag();
    } else if ($tagModal.deleteMode) {
      await handleDeleteTag();
    } else {
      await handleCreateTag();
    }
  };
</script>

<Modal
  onClose={() => resetStore()}
  bind:open={$tagModal.open}
  width="md:w-[40%] w-[80%]"
  modalHeading={$tagModal.editMode
    ? 'Edit Tag'
    : $tagModal.deleteMode
      ? 'Delete Tag'
      : 'Create Tag'}
>
  <form on:submit|preventDefault={handleSave}>
    {#if !$tagModal.editMode && !$tagModal.deleteMode}
      <div>
        <TextField
          label="Tag Name"
          className="w-full mb-5"
          labelClassName="text-xs mb-2 font-normal"
          inputClassName="text-sm"
          placeholder=""
          bind:value={name}
        />

        <TextArea
          label="Description"
          labelClassName="text-xs mb-2 font-normal"
          bind:value={description}
          rows={5}
          placeholder=""
        />
      </div>
    {/if}

    {#if !$tagModal.deleteMode && $tagModal.editMode}
      <div>
        <TextField
          label="Tag Name"
          className="w-full mb-5"
          labelClassName="text-xs mb-2 font-normal"
          inputClassName="text-sm"
          placeholder=""
          bind:value={$selectedTag.name}
        />

        <TextArea
          label="Description"
          labelClassName="text-xs mb-2 font-normal"
          bind:value={$selectedTag.description}
          rows={5}
          placeholder=""
        />
      </div>
    {/if}

    {#if $tagModal.deleteMode}
      <div class="flex justify-center items-center">
        <h1 class="text-sm m-0">Are you sure you want to delete this tag?</h1>
      </div>
    {/if}

    <div
      class="flex {$tagModal.deleteMode
        ? 'justify-center'
        : 'justify-end'} items-center gap-10 mt-5"
    >
      <PrimaryButton
        width="w-[30%]"
        className="py-3 rounded-md text-sm font-medium"
        label={$tagModal.deleteMode ? 'No' : 'Cancel'}
        type="button"
        onClick={() => resetStore()}
        variant={VARIANTS.OUTLINED}
      />
      <PrimaryButton
        width="w-[30%]"
        className="py-3 rounded-md text-sm font-medium"
        label={$tagModal.deleteMode ? 'Yes' : 'Save'}
        type="submit"
        variant={$tagModal.deleteMode ? VARIANTS.CONTAINED_DANGER : VARIANTS.CONTAINED}
        {isLoading}
      />
    </div>
  </form>
</Modal>
