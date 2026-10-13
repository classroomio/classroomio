<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { currentOrg, currentOrgPath, isOrgAdmin } from '$lib/utils/store/org';
  import { PluginIcon, pluginsApi } from '$features/plugins';
  import { PluginHostFrame } from '$features/plugins/components';
  import type { ResolvedContributionItem } from '$features/plugins/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import BlocksIcon from '@lucide/svelte/icons/blocks';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import PowerIcon from '@lucide/svelte/icons/power';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';

  let listedOrgId = '';
  let contributions = $state<ResolvedContributionItem[]>([]);
  let isEnabling = $state(false);

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId) return;

    if (!$isOrgAdmin) {
      void goto($currentOrgPath);
      return;
    }

    if (listedOrgId === organizationId) return;

    listedOrgId = organizationId;
    void pluginsApi.listOrgInstallations(organizationId);
    void pluginsApi.listOrgContributions(organizationId, 'plugin.page').then((result) => {
      if ($currentOrg.id === organizationId) contributions = result;
    });
  });

  const installation = $derived(pluginsApi.installations.find((inst) => inst.pluginId === page.params.pluginId));

  const contribution = $derived(
    contributions.find(
      (item) => item.pluginId === page.params.pluginId && item.target === 'plugin.page' && item.artifactUrl
    )
  );

  async function handleEnable() {
    if (!$currentOrg.id || !installation || isEnabling) return;

    isEnabling = true;
    try {
      await pluginsApi.updateStatus(installation.id, 'active', $currentOrg.id);
      snackbar.success($t('plugins.enabled_success'));
      const result = await pluginsApi.listOrgContributions($currentOrg.id, 'plugin.page');
      contributions = result;
    } catch {
      snackbar.error($t('plugins.failed_update'));
    } finally {
      isEnabling = false;
    }
  }
</script>

<div class="flex h-full w-full flex-col">
  {#if !installation && pluginsApi.loading}
    <div class="flex h-96 flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2Icon class="size-6 animate-spin text-blue-500" />
      <span class="text-sm">{$t('plugins.loading')}</span>
    </div>
  {:else if !installation}
    <div
      class="mx-auto mt-16 max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"
    >
      <div
        class="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800"
      >
        <BlocksIcon class="size-6" />
      </div>
      <h3 class="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
        {$t('plugins.not_found')}
      </h3>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {$t('plugins.not_found_desc')}
      </p>
      <a
        href="{$currentOrgPath}/plugins"
        class="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
      >
        <ArrowLeftIcon class="size-3.5" />
        <span>{$t('plugins.back_to_plugins')}</span>
      </a>
    </div>
  {:else if installation.status !== 'active'}
    <div
      class="mx-auto mt-16 max-w-md rounded-xl border border-amber-200 bg-amber-50/50 p-8 text-center dark:border-amber-900/50 dark:bg-amber-950/20"
    >
      <div
        class="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
      >
        <PowerIcon class="size-6" />
      </div>
      <h3 class="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
        {$t('plugins.plugin_disabled_title')}
      </h3>
      <p class="mt-1 text-xs text-slate-600 dark:text-slate-400">
        {$t('plugins.plugin_disabled_desc')}
      </p>
      <div class="mt-6 flex items-center justify-center gap-3">
        <a
          href="{$currentOrgPath}/plugins"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <ArrowLeftIcon class="size-3.5" />
          <span>{$t('plugins.back_to_plugins')}</span>
        </a>
        <button
          type="button"
          onclick={handleEnable}
          disabled={isEnabling}
          class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {#if isEnabling}
            <Loader2Icon class="size-3.5 animate-spin" />
          {/if}
          <span>{$t('plugins.enable')}</span>
        </button>
      </div>
    </div>
  {:else if contribution?.artifactUrl}
    <div class="flex h-[calc(100vh-3.5rem)] w-full flex-col overflow-hidden">
      <PluginHostFrame
        installationId={contribution.installationId}
        pluginId={contribution.pluginId}
        version={contribution.version}
        organizationId={$currentOrg.id}
        srcUrl={contribution.artifactUrl}
        title={contribution.title}
        backendAudience={contribution.backendAudience}
        target="plugin.page"
        resource={{ type: 'organization', id: $currentOrg.id }}
        className="h-full w-full border-0"
      />
    </div>
  {:else}
    {@const manifest = installation.manifest as any}

    <div class="mx-auto max-w-3xl px-4 py-10">
      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div
              class="flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
            >
              <PluginIcon src={installation.iconUrl} alt={installation.plugin.name} />
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">
                {installation.plugin.name}
              </h2>
              <div class="mt-1 flex items-center gap-2">
                <span
                  class="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                >
                  <ShieldCheckIcon class="size-3.5" />
                  {$t('plugins.status_active')}
                </span>
                <span class="text-xs text-slate-400">
                  v{manifest?.version ?? '1.0.0'}
                </span>
              </div>
            </div>
          </div>

          <a
            href="{$currentOrgPath}/plugins"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeftIcon class="size-3.5" />
            <span>{$t('plugins.back_to_plugins')}</span>
          </a>
        </div>

        <p class="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {installation.plugin.description}
        </p>

        <div class="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
          <h4 class="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            {$t('plugins.permissions')}
          </h4>
          <div class="mt-2 flex flex-wrap gap-2">
            {#if (manifest?.permissions?.required?.length ?? 0) > 0}
              {#each manifest.permissions.required as perm}
                <span
                  class="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {perm}
                </span>
              {/each}
            {:else}
              <span class="text-xs text-slate-400">{$t('plugins.no_permissions')}</span>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
