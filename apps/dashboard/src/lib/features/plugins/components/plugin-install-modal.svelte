<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { PluginIcon } from '$features/plugins';
  import { groupPluginPermissions, type FormattedPermission } from '../utils/permissions';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import LockIcon from '@lucide/svelte/icons/lock';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
  import DatabaseIcon from '@lucide/svelte/icons/database';
  import AwardIcon from '@lucide/svelte/icons/award';
  import UserIcon from '@lucide/svelte/icons/user';
  import BuildingIcon from '@lucide/svelte/icons/building';
  import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  interface Props {
    open: boolean;
    plugin: {
      id: string;
      name: string;
      publisher: string;
      version: string;
      description?: string;
      iconUrl?: string | null;
      permissions: string[];
    } | null;
    isInstalling?: boolean;
    onConfirm: () => Promise<void> | void;
    onClose: () => void;
  }

  let { open = $bindable(false), plugin, isInstalling = false, onConfirm, onClose }: Props = $props();

  const permissionGroups = $derived.by(() => {
    if (!plugin || !plugin.permissions) return [];
    return groupPluginPermissions(plugin.permissions);
  });

  function getCategoryIcon(category: FormattedPermission['category']) {
    switch (category) {
      case 'courses':
        return BookOpenIcon;
      case 'lessons':
        return FileTextIcon;
      case 'progress':
        return GraduationCapIcon;
      case 'storage':
        return DatabaseIcon;
      case 'certificates':
        return AwardIcon;
      case 'identity':
        return UserIcon;
      case 'organization':
        return BuildingIcon;
      default:
        return LockIcon;
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && !isInstalling) {
      open = false;
      onClose();
    }
  }
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-lg overflow-hidden p-0 sm:rounded-2xl">
    {#if plugin}
      <!-- Header -->
      <div class="border-b border-slate-100 bg-slate-50/60 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <div class="flex items-start gap-4">
          <div
            class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs dark:bg-indigo-950/70 dark:text-indigo-400"
          >
            <PluginIcon src={plugin.iconUrl} alt={plugin.name} />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h2 class="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                {plugin.name}
              </h2>
              <span
                class="inline-flex shrink-0 items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
              >
                <ShieldCheckIcon class="size-3" />
                <span>{$t('plugins.badge_official')}</span>
              </span>
            </div>

            <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {$t('plugins.publisher', { name: plugin.publisher })} • v{plugin.version}
            </p>
          </div>
        </div>

        <div
          class="mt-4 flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-600 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <div
            class="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300"
          >
            {$currentOrg.name?.charAt(0) || 'A'}
          </div>
          <span class="truncate">
            Installing to <strong>{$currentOrg.name}</strong>
          </span>
        </div>
      </div>

      <!-- Permissions Body -->
      <div class="max-h-[380px] overflow-y-auto p-6">
        <div class="mb-4">
          <h3 class="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            {$t('plugins.permissions_requested_title')}
          </h3>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {$t('plugins.permissions_requested_desc', { name: plugin.name })}
          </p>
        </div>

        {#if permissionGroups.length === 0}
          <div
            class="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
          >
            <ShieldCheckIcon class="size-5 text-emerald-500" />
            <div>
              <p class="text-xs font-medium text-slate-900 dark:text-slate-100">
                {$t('plugins.no_permissions')}
              </p>
              <p class="mt-0.5 text-[11px] text-slate-500">
                {$t('plugins.no_permissions_desc')}
              </p>
            </div>
          </div>
        {:else}
          <div class="space-y-4">
            {#each permissionGroups as group (group.category)}
              <div
                class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div class="mb-2.5 flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span class="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {group.categoryLabel}
                  </span>
                </div>

                <div class="space-y-3">
                  {#each group.permissions as perm (perm.id)}
                    {@const Icon = getCategoryIcon(perm.category)}
                    <div class="flex items-start gap-3">
                      <div
                        class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Icon class="size-3.5" />
                      </div>

                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-medium text-slate-900 dark:text-slate-100">
                            {perm.name}
                          </span>
                          {#if perm.isSensitive}
                            <span
                              class="py-0.2 inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 text-[9px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                            >
                              <AlertTriangleIcon class="size-2.5" />
                              <span>Sensitive</span>
                            </span>
                          {/if}
                        </div>
                        <p class="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {perm.description}
                        </p>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Security Notice -->
        <div
          class="mt-5 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-blue-900 dark:border-blue-950/50 dark:bg-blue-950/20 dark:text-blue-200"
        >
          <LockIcon class="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p class="text-[11px] leading-relaxed">
            {$t('plugins.security_notice')}
          </p>
        </div>
      </div>

      <!-- Footer Actions -->
      <div
        class="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/40"
      >
        <Button variant="outline" onclick={onClose} disabled={isInstalling} class="text-xs">
          {$t('plugins.cancel')}
        </Button>

        <Button
          variant="default"
          onclick={onConfirm}
          disabled={isInstalling}
          class="bg-blue-600 text-xs text-white hover:bg-blue-700"
        >
          {#if isInstalling}
            <Loader2Icon class="mr-1.5 size-3.5 animate-spin" />
            <span>{$t('plugins.installing')}</span>
          {:else}
            <ShieldCheckIcon class="mr-1.5 size-3.5" />
            <span>{$t('plugins.authorize_install')}</span>
          {/if}
        </Button>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
