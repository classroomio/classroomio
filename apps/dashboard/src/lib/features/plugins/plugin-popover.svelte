<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Input } from '@cio/ui/base/input';
  import { Switch } from '@cio/ui/base/switch';
  import { orgCapabilitiesApi } from './store/org-capabilities.svelte';
  import { resolvePluginIcon } from './utils/plugin-icons';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import BlocksIcon from '@lucide/svelte/icons/blocks';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import SearchIcon from '@lucide/svelte/icons/search';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

  let isOpen = $state(false);
  let searchQuery = $state('');

  const plugins = $derived(orgCapabilitiesApi.capabilities);

  const filteredPlugins = $derived(
    searchQuery.trim().length === 0
      ? plugins
      : plugins.filter((p) => {
          const name = $t(p.nameKey);
          const description = $t(p.descriptionKey);
          const q = searchQuery.toLowerCase();
          return (
            (name ? name.toLowerCase().includes(q) : false) ||
            (description ? description.toLowerCase().includes(q) : false)
          );
        })
  );

  function handleOpenChange(open: boolean) {
    isOpen = open;
    if (open && $currentOrg.id) {
      void orgCapabilitiesApi.ensureCapabilities($currentOrg.id);
    }
    if (!open) {
      searchQuery = '';
    }
  }

  async function handleToggle(capabilityId: string, isEnabled: boolean) {
    await orgCapabilitiesApi.toggleCapability(capabilityId, isEnabled);
  }
</script>

<Popover.Root bind:open={isOpen} onOpenChange={handleOpenChange}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Sidebar.MenuButton
        {...props}
        tooltipContent={$t('org_navigation.plugins_and_extensions')}
        isActive={isOpen}
        data-testid="org-nav-plugins"
      >
        <div class="flex items-center gap-2">
          <BlocksIcon size={16} />
          <span>{$t('org_navigation.plugins_and_extensions')}</span>
        </div>
      </Sidebar.MenuButton>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content
    side="right"
    align="start"
    sideOffset={20}
    class="flex h-[380px] w-80 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-xl dark:border-slate-800 dark:bg-slate-900"
  >
    <!-- Header -->
    <div class="shrink-0 border-b border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
      <div class="flex items-center gap-2.5">
        <div
          class="flex size-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        >
          <BlocksIcon class="size-4" />
        </div>
        <div class="min-w-0">
          <h4 class="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {$t('org_navigation.plugins_and_extensions')}
          </h4>
          <p class="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {$t('plugins.drawer_subtitle')}
          </p>
        </div>
      </div>

      <!-- Search input -->
      <div class="relative mt-2.5">
        <SearchIcon class="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder={$t('plugins.search_placeholder')}
          bind:value={searchQuery}
          class="w-full rounded-md border border-slate-200 bg-white py-1.5 pr-2.5 pl-9! text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>
    </div>

    <!-- Scrollable container -->
    <div class="flex-1 space-y-1 divide-y divide-slate-100 overflow-y-auto p-2 dark:divide-slate-800/60">
      {#if orgCapabilitiesApi.isOrgLoading() && plugins.length === 0}
        <div class="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2Icon class="size-5 animate-spin" />
          <span class="text-xs">{$t('plugins.loading')}</span>
        </div>
      {:else if filteredPlugins.length === 0}
        <div class="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
          <span class="text-xs">
            {plugins.length === 0 ? $t('plugins.empty') : $t('plugins.no_results')}
          </span>
        </div>
      {:else}
        {#each filteredPlugins as plugin (plugin.id)}
          {@const name = $t(plugin.nameKey)}
          {@const description = $t(plugin.descriptionKey)}
          {@const PluginIcon = resolvePluginIcon(plugin.icon)}

          <div
            class="rounded-lg p-2.5 pt-3 transition-colors first:pt-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 items-start gap-2.5">
                <div
                  class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  <PluginIcon class="size-3.5 text-indigo-500" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {name}
                    </span>
                    {#if plugin.isEnabled}
                      <span class="inline-flex size-1.5 rounded-full bg-emerald-500" title={$t('plugins.status_active')}
                      ></span>
                    {/if}
                  </div>
                  <p class="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                  {#if plugin.isEnabled && plugin.managePath && plugin.manageLabelKey}
                    <a
                      href="{$currentOrgPath}{plugin.managePath}"
                      onclick={() => (isOpen = false)}
                      class="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <span>{$t(plugin.manageLabelKey)}</span>
                      <ArrowUpRightIcon class="size-3" />
                    </a>
                  {/if}
                </div>
              </div>

              <div class="shrink-0 pt-0.5">
                <Switch checked={plugin.isEnabled} onCheckedChange={(checked) => handleToggle(plugin.id, checked)} />
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </Popover.Content>
</Popover.Root>
