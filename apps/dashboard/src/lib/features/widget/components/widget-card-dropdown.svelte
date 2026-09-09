<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Dialog from '@cio/ui/base/dialog';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import ArchiveIcon from '@lucide/svelte/icons/archive';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';
  import { widgetApi } from '../api/widget.svelte';
  import { t } from '$lib/utils/functions/translations';
  import type { Component } from 'svelte';

  interface Props {
    id: string;
    name: string;
    mode?: 'active' | 'archived';
    isAdmin?: boolean | null;
  }

  interface ActionItem {
    id: string;
    label: string;
    icon: Component;
    variant?: 'destructive';
    adminOnly?: boolean;
    onClick: () => void;
  }

  let { id, name, mode = 'active', isAdmin = false }: Props = $props();

  let renameOpen = $state(false);
  let deleteOpen = $state(false);
  let draftName = $state('');

  async function handleRename() {
    const trimmedDraftName = draftName.trim();
    if (!trimmedDraftName) return;

    if (trimmedDraftName === name) {
      renameOpen = false;
      return;
    }

    await widgetApi.updateWidget(id, { name: trimmedDraftName });
    renameOpen = false;
  }

  async function handleArchive() {
    await widgetApi.archiveWidget(id);
  }

  async function handlePermanentDelete() {
    await widgetApi.deleteWidget(id);
    deleteOpen = false;
  }

  const actions = $derived<ActionItem[]>(
    mode === 'active'
      ? [
          {
            id: 'rename',
            label: $t('widgets.actions.rename'),
            icon: PencilIcon,
            onClick: () => {
              draftName = name;
              renameOpen = true;
            }
          },
          {
            id: 'archive',
            label: $t('widgets.actions.archive'),
            icon: ArchiveIcon,
            adminOnly: true,
            onClick: handleArchive
          }
        ]
      : [
          {
            id: 'delete_permanently',
            label: $t('widgets.actions.delete_permanently'),
            icon: Trash2Icon,
            variant: 'destructive',
            adminOnly: true,
            onClick: () => (deleteOpen = true)
          }
        ]
  );

  const visibleActions = $derived(actions.filter((action) => !action.adminOnly || Boolean(isAdmin)));
</script>

{#if visibleActions.length > 0}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      onclick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          size="icon-xs"
          class="ui:text-muted-foreground ui:hover:text-foreground ui:hover:bg-accent ui:data-[state=open]:bg-accent ui:data-[state=open]:text-foreground -mr-1.5 size-7 rounded-lg transition-colors"
          aria-label="Widget options"
        >
          <EllipsisVerticalIcon class="size-4" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>

    <DropdownMenu.Content align="end">
      {#each visibleActions as action, index (action.id)}
        {#if index > 0}
          <DropdownMenu.Separator />
        {/if}

        <DropdownMenu.Item variant={action.variant} onclick={action.onClick}>
          <action.icon class="size-4" />
          <span>{action.label}</span>
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}

<Dialog.Root
  bind:open={renameOpen}
  onOpenChange={(isOpen) => {
    if (!isOpen) {
      draftName = '';
    }
  }}
>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{$t('widgets.actions.rename')}</Dialog.Title>
    </Dialog.Header>
    <InputField label={$t('widgets.form.name')} bind:value={draftName} />
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (renameOpen = false)}>{$t('app.cancel')}</Button>
      <Button onclick={handleRename}>{$t('app.save')}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={deleteOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{$t('widgets.delete_modal.title')}</Dialog.Title>
      <Dialog.Description>
        {$t('widgets.delete_modal.description', { name })}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (deleteOpen = false)}>{$t('app.cancel')}</Button>
      <Button variant="destructive" onclick={handlePermanentDelete}>
        {$t('widgets.actions.delete_permanently')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
