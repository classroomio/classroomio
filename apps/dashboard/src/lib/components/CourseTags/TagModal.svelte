<script lang="ts">
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
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
    ? $t('tags.tag_modal.edit_tag')
    : $tagModal.deleteMode
      ? $t('tags.tag_modal.delete_tag')
      : $t('tags.tag_modal.create_tag')}
>
  <form on:submit|preventDefault={handleSave}>
    {#if !$tagModal.editMode && !$tagModal.deleteMode}
      <div>
        <TextField
          label={$t('tags.tag_modal.tag_name')}
          className="w-full mb-5"
          labelClassName="text-xs mb-2 font-normal"
          inputClassName="text-sm"
          placeholder=""
          bind:value={name}
        />

        <TextArea
          label={$t('tags.tag_modal.description')}
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
          label={$t('tags.tag_modal.tag_name')}
          className="w-full mb-5"
          labelClassName="text-xs mb-2 font-normal"
          inputClassName="text-sm"
          placeholder=""
          bind:value={$selectedTag.name}
        />

        <TextArea
          label={$t('tags.tag_modal.description')}
          labelClassName="text-xs mb-2 font-normal"
          bind:value={$selectedTag.description}
          rows={5}
          placeholder=""
        />
      </div>
    {/if}

    {#if $tagModal.deleteMode}
      <div class="flex justify-center items-center">
        <h1 class="text-sm m-0">{$t('tags.tag_modal.delete_modal')}</h1>
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
        label={$tagModal.deleteMode ? $t('tags.tag_modal.no') : $t('tags.tag_modal.cancel')}
        type="button"
        onClick={() => resetStore()}
        variant={VARIANTS.OUTLINED}
      />
      <PrimaryButton
        width="w-[30%]"
        className="py-3 rounded-md text-sm font-medium"
        label={$tagModal.deleteMode ? $t('tags.tag_modal.yes') : $t('tags.tag_modal.save')}
        type="submit"
        variant={$tagModal.deleteMode ? VARIANTS.CONTAINED_DANGER : VARIANTS.CONTAINED}
        {isLoading}
      />
    </div>
  </form>
</Modal>
