<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';

  import { tagApi } from '$features/tag/api';
  import type { CreatedTagGroup, OrganizationTagGroup } from '$features/tag/utils/types';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    open?: boolean;
    mode?: 'create' | 'edit';
    group?: OrganizationTagGroup | null;
    onCreated?: (group: CreatedTagGroup) => void;
    onClosed?: () => void;
  }

  let { open = $bindable(false), mode = 'create', group = null, onCreated, onClosed }: Props = $props();

  let groupName = $state('');
  let groupDescription = $state('');

  $effect(() => {
    if (!open) return;

    groupName = mode === 'edit' ? (group?.name ?? '') : '';
    groupDescription = mode === 'edit' ? (group?.description ?? '') : '';
  });

  function handleClose() {
    open = false;
    tagApi.reset();
    onClosed?.();
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      handleClose();

      return;
    }

    open = nextOpen;
  }

  async function handleSubmit() {
    if (mode === 'edit' && group) {
      const updated = await tagApi.updateTagGroup(group.id, {
        name: groupName,
        description: groupDescription || undefined
      });

      if (!updated) {
        return;
      }

      handleClose();

      return;
    }

    const created = await tagApi.createTagGroup({
      name: groupName,
      description: groupDescription || undefined
    });

    if (!created) {
      return;
    }

    handleClose();
    onCreated?.(created);
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>
        {$t(mode === 'edit' ? 'tags_admin.group_modal.edit_title' : 'tags_admin.group_modal.create_title')}
      </Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4 py-2">
      <InputField
        label={$t('tags_admin.group_modal.name')}
        bind:value={groupName}
        errorMessage={tagApi.errors.name}
        autoFocus
      />

      <TextareaField
        label={$t('tags_admin.group_modal.description')}
        placeholder={$t('tags_admin.group_modal.description_placeholder')}
        bind:value={groupDescription}
        errorMessage={tagApi.errors.description}
      />
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => handleOpenChange(false)}>
        {$t('tags_admin.actions.cancel')}
      </Button>
      <Button onclick={handleSubmit} loading={tagApi.isLoading}>
        {$t('tags_admin.actions.save')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
