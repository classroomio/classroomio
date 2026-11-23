<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { t } from '$lib/utils/functions/translations';
  import { learningPathApi } from '../api/learning-path.svelte';

  interface Props {
    open: boolean;
  }

  let { open = $bindable(false) }: Props = $props();

  const fields = $state({ name: '', description: '' });
  let isCreating = $state(false);

  function resetForm() {
    fields.name = '';
    fields.description = '';
    learningPathApi.errors = {};
  }

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (!isOpen) {
      resetForm();
    }
  }

  async function handleCreate() {
    isCreating = true;

    try {
      const created = await learningPathApi.createPath(fields);
      if (!created) return;

      handleOpenChange(false);
      await goto(resolve(`/paths/${created.id}/courses`, {}));
    } finally {
      isCreating = false;
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('learning_paths.create_modal.title')}</Dialog.Title>
      <Dialog.Description>{$t('learning_paths.create_modal.description')}</Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col gap-4 py-2">
      <InputField
        label={$t('learning_paths.fields.name')}
        placeholder={$t('learning_paths.create_modal.name_placeholder')}
        bind:value={fields.name}
        isRequired
        errorMessage={learningPathApi.errors.name}
        onInput={() => learningPathApi.clearError('name')}
        testId="learning-path-create-name"
      />
      <TextareaField
        label={$t('learning_paths.fields.description')}
        placeholder={$t('learning_paths.create_modal.description_placeholder')}
        bind:value={fields.description}
        rows={3}
      />
    </div>

    <Dialog.Footer>
      <Button size="sm" variant="outline" onclick={() => handleOpenChange(false)}>{$t('app.cancel')}</Button>
      <Button
        size="sm"
        onclick={handleCreate}
        disabled={!fields.name.trim() || isCreating}
        loading={isCreating}
        testId="learning-path-create-submit"
      >
        {$t('learning_paths.create_modal.submit')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
