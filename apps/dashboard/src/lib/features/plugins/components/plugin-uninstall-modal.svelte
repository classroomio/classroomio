<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Spinner } from '@cio/ui/base/spinner';
  import AlertTriangleIcon from '@lucide/svelte/icons/triangle-alert';
  import DatabaseIcon from '@lucide/svelte/icons/database';
  import AwardIcon from '@lucide/svelte/icons/award';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { pluginsApi } from '../api/plugins.svelte';
  import type { PluginUninstallImpact } from '../utils/types';

  interface Props {
    open: boolean;
    plugin: { installationId: string; name: string } | null;
    isUninstalling?: boolean;
    onConfirm: (options: { deletePluginStorage: boolean; removePublishedOutputs: boolean }) => Promise<void> | void;
    onClose: () => void;
  }

  let { open = $bindable(false), plugin, isUninstalling = false, onConfirm, onClose }: Props = $props();

  let impact = $state<PluginUninstallImpact | null>(null);
  let loadedInstallationId = $state('');
  let deletePluginStorage = $state(false);
  let removePublishedOutputs = $state(false);

  $effect(() => {
    const organizationId = $currentOrg.id;
    const installationId = plugin?.installationId;
    if (!open || !organizationId || !installationId || loadedInstallationId === installationId) return;

    loadedInstallationId = installationId;
    void pluginsApi.getUninstallImpact(installationId, organizationId).then((result) => {
      if (open && plugin?.installationId === installationId) impact = result;
    });
  });

  function reset() {
    impact = null;
    loadedInstallationId = '';
    deletePluginStorage = false;
    removePublishedOutputs = false;
  }

  function handleOpenChange(isOpen: boolean) {
    if (isOpen || isUninstalling) return;

    open = false;
    reset();
    onClose();
  }

  function handleClose() {
    if (isUninstalling) return;

    open = false;
    reset();
    onClose();
  }
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{$t('plugins.uninstall_modal.title', { name: plugin?.name ?? '' })}</Dialog.Title>
      <Dialog.Description>{$t('plugins.uninstall_modal.description')}</Dialog.Description>
    </Dialog.Header>

    {#if !impact}
      <div class="flex min-h-40 items-center justify-center">
        <Spinner class="size-6" />
      </div>
    {:else}
      <div class="space-y-3 py-2">
        <label class="ui:border-border flex cursor-pointer items-start gap-3 rounded-lg border p-4">
          <Checkbox bind:checked={deletePluginStorage} disabled={isUninstalling || impact.storageRecords === 0} />
          <DatabaseIcon class="ui:text-muted-foreground mt-0.5 size-4 shrink-0" />
          <span>
            <span class="block text-sm font-medium">{$t('plugins.uninstall_modal.delete_storage')}</span>
            <span class="ui:text-muted-foreground mt-1 block text-xs">
              {$t('plugins.uninstall_modal.delete_storage_description', {
                count: impact.storageRecords
              })}
            </span>
          </span>
        </label>

        <label class="ui:border-border flex cursor-pointer items-start gap-3 rounded-lg border p-4">
          <Checkbox bind:checked={removePublishedOutputs} disabled={isUninstalling || impact.publishedOutputs === 0} />
          <AwardIcon class="ui:text-muted-foreground mt-0.5 size-4 shrink-0" />
          <span>
            <span class="block text-sm font-medium">{$t('plugins.uninstall_modal.remove_outputs')}</span>
            <span class="ui:text-muted-foreground mt-1 block text-xs">
              {$t('plugins.uninstall_modal.remove_outputs_description', { count: impact.publishedOutputs })}
            </span>
          </span>
        </label>

        {#if deletePluginStorage || removePublishedOutputs}
          <div
            class="ui:border-destructive/30 ui:bg-destructive/5 ui:text-destructive flex gap-2 rounded-lg border p-3 text-xs"
          >
            <AlertTriangleIcon class="mt-0.5 size-4 shrink-0" />
            <span>{$t('plugins.uninstall_modal.destructive_warning')}</span>
          </div>
        {/if}
      </div>
    {/if}

    <Dialog.Footer>
      <Button size="sm" variant="outline" onclick={handleClose} disabled={isUninstalling}>
        {$t('common.cancel')}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onclick={() => onConfirm({ deletePluginStorage, removePublishedOutputs })}
        disabled={!impact || isUninstalling}
      >
        {isUninstalling ? $t('plugins.uninstalling') : $t('plugins.uninstall')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
