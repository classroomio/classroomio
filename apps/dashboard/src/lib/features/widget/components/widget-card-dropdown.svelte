<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Dialog from '@cio/ui/base/dialog';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';
  import { widgetApi } from '../api/widget.svelte';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    id: string;
    name: string;
  }

  let { id, name }: Props = $props();

  let renameOpen = $state(false);
  let draftName = $state(name);

  async function handleRename() {
    await widgetApi.updateWidget(id, { name: draftName });
    renameOpen = false;
  }

  async function handleDelete() {
    await widgetApi.deleteWidget(id);
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class="ui:data-[state=open]:opacity-100 absolute top-4 right-4 z-40 flex items-center justify-center opacity-0 transition-all delay-150 duration-200 ease-in-out group-hover:opacity-100"
    onclick={(e) => e.stopPropagation()}
  >
    <IconButton variant="outline">
      <EllipsisVerticalIcon size={16} />
    </IconButton>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item
      onclick={(e) => {
        e.stopPropagation();
        draftName = name;
        renameOpen = true;
      }}
    >
      {$t('widgets.actions.rename')}
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item
      class="text-red-600"
      onclick={(e) => {
        e.stopPropagation();
        handleDelete();
      }}
    >
      {$t('widgets.actions.delete')}
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<Dialog.Root bind:open={renameOpen}>
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
