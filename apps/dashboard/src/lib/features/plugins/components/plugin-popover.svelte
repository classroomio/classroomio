<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Input } from '@cio/ui/base/input';
  import { Switch } from '@cio/ui/base/switch';
  import { pluginsApi } from '../api/plugins.svelte';
  import PluginIcon from './plugin-icon.svelte';
  import PluginInstallModal from './plugin-install-modal.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { snackbar } from '$features/ui/snackbar/store';
  import BlocksIcon from '@lucide/svelte/icons/blocks';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import SearchIcon from '@lucide/svelte/icons/search';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: import('svelte').Snippet<[{ props: Record<string, unknown> }]>;
  }

  let { open = $bindable(false), onOpenChange, trigger }: Props = $props();

  let searchQuery = $state('');
  let isUpdating = $state(false);
  let installTargetPlugin = $state<{
    id: string;
    name: string;
    publisher: string;
    version: string;
    description?: string;
    iconUrl?: string | null;
    permissions: string[];
  } | null>(null);
  let isInstallModalOpen = $state(false);

  interface PopoverPluginItem {
    id: string;
    installationId?: string;
    version: string;
    name: string;
    description: string;
    publisher: string;
    iconUrl?: string | null;
    isActive: boolean;
    isInstalled: boolean;
    permissions: string[];
    managePath?: string;
  }

  const displayPlugins = $derived.by(() => {
    const installed = pluginsApi.installations;
    const catalog = pluginsApi.catalog;

    const items: PopoverPluginItem[] = [];

    const seenIds = new Set<string>();

    for (const inst of installed) {
      if (inst.status === 'uninstalled') continue;
      seenIds.add(inst.pluginId);

      const manifest = inst.manifest as any;
      const contributesPages = manifest?.contributes?.pages;
      const hasPage = Boolean(contributesPages && contributesPages.length > 0);
      const permissions = [...(manifest?.permissions?.required ?? []), ...(manifest?.permissions?.optional ?? [])];

      items.push({
        id: inst.pluginId,
        installationId: inst.id,
        version: manifest?.version ?? '1.0.0',
        name: inst.plugin?.name ?? inst.pluginId,
        description: inst.plugin?.description ?? '',
        publisher: inst.plugin?.publisher ?? 'ClassroomIO',
        iconUrl: inst.iconUrl ?? null,
        isActive: inst.status === 'active',
        isInstalled: true,
        permissions,
        managePath: hasPage ? `/plugins/${inst.pluginId}` : undefined
      });
    }

    for (const cat of catalog) {
      if (seenIds.has(cat.id)) continue;

      items.push({
        id: cat.id,
        version: cat.latestVersion ?? '1.0.0',
        name: cat.name,
        description: cat.description ?? '',
        publisher: cat.publisher ?? 'ClassroomIO',
        iconUrl: cat.iconUrl ?? null,
        isActive: false,
        isInstalled: false,
        permissions: (cat as any).permissions ?? []
      });
    }

    return items;
  });

  const filteredPlugins = $derived(
    searchQuery.trim().length === 0
      ? displayPlugins
      : displayPlugins.filter((p) => {
          const q = searchQuery.toLowerCase();
          return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
        })
  );

  function handleOpenChange(nextOpen: boolean) {
    open = nextOpen;
    onOpenChange?.(nextOpen);

    if (nextOpen && $currentOrg.id) {
      void pluginsApi.listOrgInstallations($currentOrg.id);
      void pluginsApi.listCatalog();
    }

    if (!nextOpen) {
      searchQuery = '';
    }
  }

  function promptInstall(plugin: PopoverPluginItem) {
    open = false;
    installTargetPlugin = plugin;
    isInstallModalOpen = true;
  }

  async function handleConfirmInstall() {
    if (!$currentOrg.id || !installTargetPlugin || isUpdating) return;

    isUpdating = true;
    try {
      const result = await pluginsApi.install(installTargetPlugin.id, installTargetPlugin.version, $currentOrg.id);
      if (result) {
        snackbar.success($t('plugins.installed_success'));
        isInstallModalOpen = false;
        installTargetPlugin = null;
      } else {
        snackbar.error($t('plugins.failed_install'));
      }
    } catch {
      snackbar.error($t('plugins.failed_install'));
    } finally {
      isUpdating = false;
    }
  }

  function handleCloseInstallModal() {
    isInstallModalOpen = false;
    installTargetPlugin = null;
  }

  async function handleToggle(plugin: PopoverPluginItem, checked: boolean) {
    if (!$currentOrg.id || isUpdating) return;

    if (!plugin.isInstalled) {
      promptInstall(plugin);
      return;
    }

    if (!plugin.installationId) return;

    isUpdating = true;
    try {
      const nextStatus = checked ? 'active' : 'disabled';
      const result = await pluginsApi.updateStatus(plugin.installationId, nextStatus, $currentOrg.id);
      if (result) {
        snackbar.success(checked ? $t('plugins.enabled_success') : $t('plugins.disabled_success'));
      } else {
        snackbar.error($t('plugins.failed_update'));
      }
    } catch {
      snackbar.error($t('plugins.failed_update'));
    } finally {
      isUpdating = false;
    }
  }
</script>

<Popover.Root bind:open onOpenChange={handleOpenChange}>
  <Popover.Trigger>
    {#snippet child({ props })}
      {#if trigger}
        {@render trigger({ props })}
      {:else}
        <Sidebar.MenuButton
          {...props}
          tooltipContent={$t('org_navigation.plugins_and_extensions')}
          isActive={open}
          data-testid="org-nav-plugins"
        >
          <div class="flex items-center gap-2">
            <BlocksIcon size={16} />
            <span>{$t('org_navigation.plugins_and_extensions')}</span>
          </div>
        </Sidebar.MenuButton>
      {/if}
    {/snippet}
  </Popover.Trigger>

  <Popover.Content
    side="right"
    align="start"
    sideOffset={14}
    class="z-100 flex h-[420px] w-84 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
  >
    <div class="shrink-0 border-b border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
      <div class="flex items-center justify-between gap-2.5">
        <div class="flex min-w-0 flex-1 items-center gap-2.5">
          <div
            class="flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
          >
            <BlocksIcon class="size-4" />
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
              {$t('org_navigation.plugins_and_extensions')}
            </h4>
            <p class="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {$t('plugins.drawer_subtitle')}
            </p>
          </div>
        </div>

        <a
          href="{$currentOrgPath}/plugins"
          onclick={() => (open = false)}
          class="flex size-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          aria-label={$t('plugins.browse_all')}
        >
          <LayoutGridIcon class="size-3.5" />
        </a>
      </div>

      <div class="mt-2.5 flex items-center">
        <div class="relative w-full">
          <SearchIcon class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder={$t('plugins.search_placeholder')}
            bind:value={searchQuery}
            class="h-8 w-full rounded-md border border-slate-200 bg-white py-1.5 pr-2.5 pl-8! text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </div>
    </div>

    <div class="flex-1 space-y-1 divide-y divide-slate-100 overflow-y-auto p-2 dark:divide-slate-800/60">
      {#if pluginsApi.loading && displayPlugins.length === 0}
        <div class="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2Icon class="size-5 animate-spin" />
          <span class="text-xs">{$t('plugins.loading')}</span>
        </div>
      {:else if filteredPlugins.length === 0}
        <div class="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
          <span class="text-xs">
            {displayPlugins.length === 0 ? $t('plugins.empty') : $t('plugins.no_results')}
          </span>
        </div>
      {:else}
        {#each filteredPlugins as plugin (plugin.id)}
          <div
            class="rounded-lg p-2.5 pt-3 transition-colors first:pt-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 items-start gap-2.5">
                <div
                  class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  <PluginIcon src={plugin.iconUrl} alt={plugin.name} />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {plugin.name}
                    </span>
                    {#if plugin.isActive}
                      <span class="inline-flex size-1.5 rounded-full bg-emerald-500" title={$t('plugins.status_active')}
                      ></span>
                    {/if}
                  </div>
                  <p class="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {plugin.description}
                  </p>
                  {#if plugin.isActive && plugin.managePath}
                    <a
                      href="{$currentOrgPath}{plugin.managePath}"
                      onclick={() => (open = false)}
                      class="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <span>{$t('plugins.open_plugin')}</span>
                      <ArrowUpRightIcon class="size-3" />
                    </a>
                  {/if}
                </div>
              </div>

              <div class="shrink-0 pt-0.5">
                <Switch
                  checked={plugin.isActive}
                  disabled={isUpdating}
                  onCheckedChange={(checked) => handleToggle(plugin, checked)}
                />
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <div class="shrink-0 border-t border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/30">
      <a
        href="{$currentOrgPath}/plugins"
        onclick={() => (open = false)}
        class="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <span>{$t('plugins.browse_all')}</span>
        <ArrowRightIcon class="size-3" />
      </a>
    </div>
  </Popover.Content>
</Popover.Root>

<PluginInstallModal
  open={isInstallModalOpen}
  plugin={installTargetPlugin}
  isInstalling={isUpdating}
  onConfirm={handleConfirmInstall}
  onClose={handleCloseInstallModal}
/>
