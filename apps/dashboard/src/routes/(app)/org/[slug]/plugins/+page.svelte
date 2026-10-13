<script lang="ts">
  import { PluginIcon, pluginsApi } from '$features/plugins';
  import { PluginInstallModal } from '$features/plugins/components';
  import { summarizePluginPermissions } from '$features/plugins/utils/permissions';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import * as Page from '@cio/ui/base/page';
  import { Switch } from '@cio/ui/base/switch';
  import { Input } from '@cio/ui/base/input';
  import * as Tabs from '@cio/ui/base/tabs';
  import BlocksIcon from '@lucide/svelte/icons/blocks';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import SearchIcon from '@lucide/svelte/icons/search';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

  let listedOrgId = '';
  let searchQuery = $state('');
  let currentTab = $state('all');
  let processingPluginId = $state<string | null>(null);
  let installTargetPlugin = $state<DisplayPluginCard | null>(null);
  let isInstallModalOpen = $state(false);

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || organizationId === listedOrgId) return;

    listedOrgId = organizationId;
    void pluginsApi.listCatalog();
    void pluginsApi.listOrgInstallations(organizationId);
  });

  interface DisplayPluginCard {
    id: string;
    name: string;
    description: string;
    publisher: string;
    version: string;
    iconUrl?: string | null;
    isInstalled: boolean;
    isActive: boolean;
    installationId?: string;
    hasPage: boolean;
    permissions: string[];
  }

  const allPlugins = $derived.by(() => {
    const installed = pluginsApi.installations;
    const catalog = pluginsApi.catalog;
    const items: DisplayPluginCard[] = [];
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
        name: inst.plugin?.name ?? inst.pluginId,
        description: inst.plugin?.description ?? '',
        publisher: inst.plugin?.publisher ?? 'ClassroomIO',
        version: manifest?.version ?? '1.0.0',
        iconUrl: inst.iconUrl ?? null,
        isInstalled: true,
        isActive: inst.status === 'active',
        installationId: inst.id,
        hasPage,
        permissions
      });
    }

    for (const cat of catalog) {
      if (seenIds.has(cat.id)) continue;

      items.push({
        id: cat.id,
        name: cat.name,
        description: cat.description ?? '',
        publisher: cat.publisher ?? 'ClassroomIO',
        version: cat.latestVersion ?? '1.0.0',
        iconUrl: cat.iconUrl ?? null,
        isInstalled: false,
        isActive: false,
        hasPage: false,
        permissions: (cat as any).permissions ?? []
      });
    }

    return items;
  });

  const filteredPlugins = $derived.by(() => {
    return allPlugins.filter((item) => {
      if (currentTab === 'installed' && !item.isInstalled) return false;
      if (currentTab === 'available' && item.isInstalled) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.publisher.toLowerCase().includes(q)
      );
    });
  });

  async function handleToggle(plugin: DisplayPluginCard, checked: boolean) {
    if (!$currentOrg.id || !plugin.installationId || processingPluginId) return;

    processingPluginId = plugin.id;
    try {
      const nextStatus = checked ? 'active' : 'disabled';
      await pluginsApi.updateStatus(plugin.installationId, nextStatus, $currentOrg.id);
      snackbar.success(checked ? 'plugins.enabled_success' : 'plugins.disabled_success');
    } catch {
      snackbar.error('plugins.failed_update');
    } finally {
      processingPluginId = null;
    }
  }

  function promptInstall(plugin: DisplayPluginCard) {
    installTargetPlugin = plugin;
    isInstallModalOpen = true;
  }

  async function handleConfirmInstall() {
    if (!$currentOrg.id || !installTargetPlugin || processingPluginId) return;

    processingPluginId = installTargetPlugin.id;
    try {
      await pluginsApi.install(installTargetPlugin.id, installTargetPlugin.version, $currentOrg.id);
      snackbar.success('plugins.installed_success');
      isInstallModalOpen = false;
      installTargetPlugin = null;
    } catch {
      snackbar.error('plugins.failed_install');
    } finally {
      processingPluginId = null;
    }
  }

  function handleCloseInstallModal() {
    isInstallModalOpen = false;
    installTargetPlugin = null;
  }

  async function handleUninstall(plugin: DisplayPluginCard) {
    if (!$currentOrg.id || !plugin.installationId || processingPluginId) return;

    processingPluginId = plugin.id;
    try {
      await pluginsApi.updateStatus(plugin.installationId, 'uninstalled', $currentOrg.id);
      snackbar.success('plugins.uninstalled_success');
    } catch {
      snackbar.error('plugins.failed_uninstall');
    } finally {
      processingPluginId = null;
    }
  }
</script>

<svelte:head>
  <title>{$t('plugins.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <div class="flex items-center gap-2.5">
        <div
          class="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        >
          <BlocksIcon class="size-5" />
        </div>
        <Page.Title class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {$t('plugins.title')}
        </Page.Title>
      </div>
      <Page.Subtitle class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {$t('plugins.subtitle')}
      </Page.Subtitle>
    </Page.HeaderContent>

    <Page.Action>
      <div class="relative w-64 sm:w-72">
        <SearchIcon class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder={$t('plugins.search_placeholder')}
          bind:value={searchQuery}
          class="ui:pl-9! h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9! text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>
    </Page.Action>
  </Page.Header>

  <Page.Body class="w-full space-y-6">
    {#snippet child()}
      <div class="w-full border-b border-slate-200 pb-3 dark:border-slate-800">
        <Tabs.Root bind:value={currentTab} class="w-full">
          <Tabs.List class="flex items-center gap-2">
            <Tabs.Trigger
              value="all"
              class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-100"
            >
              {$t('plugins.filter_all')} ({allPlugins.length})
            </Tabs.Trigger>
            <Tabs.Trigger
              value="installed"
              class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-100"
            >
              {$t('plugins.filter_installed')} ({allPlugins.filter((p) => p.isInstalled).length})
            </Tabs.Trigger>
            <Tabs.Trigger
              value="available"
              class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-100"
            >
              {$t('plugins.filter_available')} ({allPlugins.filter((p) => !p.isInstalled).length})
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>

      <div class="min-h-[420px] w-full">
        {#if pluginsApi.loading && allPlugins.length === 0}
          <div class="flex h-72 w-full flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2Icon class="size-8 animate-spin text-blue-500" />
            <span class="text-sm">{$t('plugins.loading')}</span>
          </div>
        {:else if filteredPlugins.length === 0}
          <div
            class="flex h-72 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800"
          >
            <div
              class="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800"
            >
              <BlocksIcon class="size-6" />
            </div>
            <h3 class="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {$t('plugins.no_results')}
            </h3>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {$t('plugins.empty_desc')}
            </p>
          </div>
        {:else}
          <div class="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {#each filteredPlugins as plugin (plugin.id)}
              {@const isProcessing = processingPluginId === plugin.id}

              <div
                class="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div>
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                      >
                        <PluginIcon src={plugin.iconUrl} alt={plugin.name} />
                      </div>
                      <div>
                        <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {plugin.name}
                        </h3>
                        <div class="mt-0.5 flex items-center gap-2">
                          <span
                            class="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <ShieldCheckIcon class="size-3 text-emerald-500" />
                            {$t('plugins.badge_official')}
                          </span>
                          <span class="text-[11px] text-slate-400">
                            v{plugin.version}
                          </span>
                        </div>
                      </div>
                    </div>

                    {#if plugin.isInstalled}
                      <div class="shrink-0">
                        <Switch
                          checked={plugin.isActive}
                          disabled={isProcessing}
                          onCheckedChange={(checked) => handleToggle(plugin, checked)}
                        />
                      </div>
                    {/if}
                  </div>

                  <p class="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {plugin.description}
                  </p>

                  {#if plugin.permissions.length > 0}
                    {@const summaries = summarizePluginPermissions(plugin.permissions)}
                    <div class="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <div class="flex items-center justify-between">
                        <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                          {$t('plugins.permissions')}
                        </span>
                        <span class="text-[10px] text-slate-400">
                          {plugin.permissions.length}
                          {plugin.permissions.length === 1 ? 'capability' : 'capabilities'}
                        </span>
                      </div>
                      <div class="mt-1.5 flex flex-wrap gap-1.5">
                        {#each summaries as summary}
                          <span
                            class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium {summary.isSensitive
                              ? 'border border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'border border-slate-200/50 bg-slate-100 text-slate-700 dark:border-slate-700/50 dark:bg-slate-800 dark:text-slate-300'}"
                          >
                            {#if summary.isSensitive}
                              <span class="size-1 rounded-full bg-amber-500"></span>
                            {:else}
                              <span class="size-1 rounded-full bg-slate-400 dark:bg-slate-500"></span>
                            {/if}
                            {summary.categoryLabel}
                          </span>
                        {/each}
                      </div>
                    </div>
                  {:else}
                    <div class="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <span class="text-[11px] text-slate-400 italic">
                        {$t('plugins.no_permissions')}
                      </span>
                    </div>
                  {/if}
                </div>

                <div
                  class="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800"
                >
                  <div>
                    {#if plugin.isInstalled}
                      <span
                        class="inline-flex items-center gap-1.5 text-xs font-medium {plugin.isActive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'}"
                      >
                        <span
                          class="size-1.5 rounded-full {plugin.isActive
                            ? 'bg-emerald-500'
                            : 'bg-slate-300 dark:bg-slate-600'}"
                        ></span>
                        {plugin.isActive ? $t('plugins.status_active') : $t('plugins.status_inactive')}
                      </span>
                    {:else}
                      <span class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <span class="size-1.5 rounded-full bg-blue-500"></span>
                        {$t('plugins.status_available')}
                      </span>
                    {/if}
                  </div>

                  <div class="flex items-center gap-2">
                    {#if plugin.isInstalled}
                      {#if plugin.isActive && plugin.hasPage}
                        <a
                          href="{$currentOrgPath}/plugins/{plugin.id}"
                          class="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          <span>{$t('plugins.open_plugin')}</span>
                          <ArrowRightIcon class="size-3" />
                        </a>
                      {/if}
                      <button
                        type="button"
                        onclick={() => handleUninstall(plugin)}
                        disabled={isProcessing}
                        title={$t('plugins.uninstall')}
                        class="flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        <Trash2Icon class="size-3.5" />
                      </button>
                    {:else}
                      <button
                        type="button"
                        onclick={() => promptInstall(plugin)}
                        disabled={isProcessing}
                        class="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                      >
                        {#if isProcessing}
                          <Loader2Icon class="size-3 animate-spin" />
                        {/if}
                        <span>{$t('plugins.install')}</span>
                      </button>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>

<PluginInstallModal
  open={isInstallModalOpen}
  plugin={installTargetPlugin}
  isInstalling={Boolean(processingPluginId && installTargetPlugin?.id === processingPluginId)}
  onConfirm={handleConfirmInstall}
  onClose={handleCloseInstallModal}
/>
