<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Popover from '@cio/ui/base/popover';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { ActionPopover } from '@cio/ui/custom/action-popover';

  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  import { tagApi } from '$features/tag/api';
  import type { CreatedTag, OrganizationTag } from '$features/tag/utils/types';
  import TagGroupFormModal from '$features/tag/components/tag-group-form-modal.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { TAG_COLOR_OPTIONS, type TTagColor } from '@cio/utils/validation/tag';

  interface Props {
    open?: boolean;
    mode?: 'create' | 'edit';
    tag?: OrganizationTag | null;
    onCreated?: (tag: CreatedTag) => void;
  }

  let { open = $bindable(false), mode = 'create', tag = null, onCreated }: Props = $props();

  let tagName = $state('');
  let tagDescription = $state('');
  let tagGroupId = $state('');
  let tagColor = $state<TTagColor>(TAG_COLOR_OPTIONS[0]);

  let isGroupModalOpen = $state(false);

  // Set when the group modal opens from this modal, so reopening skips the
  // populate-on-open effect and keeps the user's in-progress draft intact.
  let skipNextPopulation = false;

  const selectedGroup = $derived(tagApi.tagGroups.find((group) => group.id === tagGroupId));

  $effect(() => {
    if (!open) return;

    if (skipNextPopulation) {
      skipNextPopulation = false;

      return;
    }

    tagName = mode === 'edit' ? (tag?.name ?? '') : '';
    tagDescription = mode === 'edit' ? (tag?.description ?? '') : '';
    tagGroupId = mode === 'edit' ? (tag?.groupId ?? '') : '';
    tagColor = mode === 'edit' ? ((tag?.color as TTagColor) ?? TAG_COLOR_OPTIONS[0]) : TAG_COLOR_OPTIONS[0];
  });

  function handleOpenChange(nextOpen: boolean) {
    open = nextOpen;

    if (!nextOpen) {
      tagApi.reset();
    }
  }

  function handleGroupCreated(createdGroupId: string) {
    tagGroupId = createdGroupId;
  }

  function openGroupModal() {
    skipNextPopulation = true;
    open = false;
    isGroupModalOpen = true;
  }

  function handleGroupModalClosed() {
    open = true;
  }

  async function handleSubmit() {
    if (mode === 'edit' && tag) {
      const updated = await tagApi.updateTag(tag.id, {
        name: tagName,
        description: tagDescription || undefined,
        groupId: tagGroupId,
        color: tagColor
      });

      if (!updated) {
        return;
      }

      handleOpenChange(false);

      return;
    }

    const created = await tagApi.createTag({
      name: tagName,
      description: tagDescription || undefined,
      groupId: tagGroupId,
      color: tagColor
    });

    if (!created) {
      return;
    }

    handleOpenChange(false);
    onCreated?.(created);
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>
        {$t(mode === 'edit' ? 'tags_admin.tag_modal.edit_title' : 'tags_admin.tag_modal.create_title')}
      </Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4 py-2">
      <InputField
        label={$t('tags_admin.tag_modal.name')}
        bind:value={tagName}
        errorMessage={tagApi.errors.name}
        autoFocus
      />

      <TextareaField
        label={$t('tags_admin.tag_modal.description')}
        placeholder={$t('tags_admin.tag_modal.description_placeholder')}
        bind:value={tagDescription}
        errorMessage={tagApi.errors.description}
        class="max-h-40"
      />

      <div class="space-y-2">
        <p class="text-sm font-medium">{$t('tags_admin.tag_modal.category')}</p>
        <ActionPopover
          title={$t('tags_admin.tag_modal.select_category')}
          buttonText={$t('tags_admin.actions.create_group')}
          onAction={openGroupModal}
        >
          {#snippet trigger({ props })}
            <Button {...props} type="button" variant="outline" class="gap-2 font-normal">
              <span>{selectedGroup?.name || $t('tags_admin.tag_modal.select_category')}</span>
              <ChevronDownIcon size={16} />
            </Button>
          {/snippet}

          {#if !tagApi.tagGroups.length}
            <p class="ui:text-muted-foreground text-sm">{$t('tags_admin.tag_modal.no_groups')}</p>
          {:else}
            <div class="flex flex-col items-start gap-1">
              {#each tagApi.tagGroups as group (group.id)}
                <Button
                  type="button"
                  variant={group.id === tagGroupId ? 'secondary' : 'ghost'}
                  onclick={() => {
                    tagGroupId = group.id;
                  }}
                >
                  {group.name}
                </Button>
              {/each}
            </div>
          {/if}
        </ActionPopover>
        {#if tagApi.errors.groupId}
          <p class="text-sm text-red-600">{tagApi.errors.groupId}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium">{$t('tags_admin.tag_modal.color')}</p>
        <Popover.Root>
          <Popover.Trigger>
            {#snippet child({ props })}
              <Button {...props} type="button" variant="outline" class="w-full justify-start gap-2">
                <span
                  class="inline-block h-3 w-3 rounded-full border"
                  style={`background-color: ${tagColor}`}
                  aria-hidden="true"
                ></span>
                {tagColor}
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content align="start" class="w-44 p-3">
            <div class="grid grid-cols-5 gap-2">
              {#each TAG_COLOR_OPTIONS as color (color)}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  class={`h-6 w-6 rounded-full p-0 ${tagColor === color ? 'ring-2 ring-offset-1' : ''}`}
                  style={`background-color: ${color}`}
                  aria-label={color}
                  onclick={() => {
                    tagColor = color;
                  }}
                />
              {/each}
            </div>
          </Popover.Content>
        </Popover.Root>
        <p class="ui:text-muted-foreground text-xs">{$t('tags_admin.tag_modal.color_help')}</p>
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => handleOpenChange(false)}>
        {$t('tags_admin.actions.cancel')}
      </Button>
      <Button onclick={handleSubmit} loading={tagApi.isLoading} disabled={!tagGroupId}>
        {$t('tags_admin.actions.save')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<TagGroupFormModal
  bind:open={isGroupModalOpen}
  onCreated={(group) => handleGroupCreated(group.id)}
  onClosed={handleGroupModalClosed}
/>
