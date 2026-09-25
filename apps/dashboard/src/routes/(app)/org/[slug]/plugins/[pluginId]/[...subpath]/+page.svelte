<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { currentOrg, currentOrgPath, isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { orgCapabilitiesApi } from '$features/plugins';
  import { configuredPlugins } from '@plugins';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  const pluginId = $derived(page.params.pluginId);
  const orgSlug = $derived(page.params.slug);

  /** SvelteKit provides [...subpath] as an un-split string, e.g. "editor" or "editor/step2". */
  const subpath = $derived(`/${page.params.subpath}`);

  const plugin = $derived(configuredPlugins.find((p) => p.id === pluginId || p.pluginNav?.path === pluginId) ?? null);

  const isAccessible = $derived(
    Boolean(
      plugin &&
        (!plugin.pluginNav?.adminOnly || $isOrgAdmin) &&
        (() => {
          const { activation } = plugin;
          if (!activation || activation.kind === 'always') return true;
          if (activation.kind === 'org-capability') {
            return orgCapabilitiesApi.isEnabled(activation.capabilityId, $currentOrg.id ?? undefined);
          }
          return false;
        })()
    )
  );

  const isCapabilityStateReady = $derived(
    plugin?.activation?.kind !== 'org-capability' || orgCapabilitiesApi.hasLoaded($currentOrg.id ?? undefined)
  );

  /** Resolve the loader: try exact subpath first, then strip trailing segments. */
  const subLoader = $derived(
    (() => {
      const routes = plugin?.routes ?? {};
      return routes[subpath] ?? null;
    })()
  );

  onMount(() => {
    if (!plugin) {
      goto($currentOrgPath);
    }
  });
</script>

{#if !plugin}
  <div class="flex h-full items-center justify-center">
    <Loader2Icon class="size-6 animate-spin text-slate-400" />
  </div>
{:else if !isCapabilityStateReady}
  <div class="flex h-full items-center justify-center">
    <Loader2Icon class="size-6 animate-spin text-slate-400" />
  </div>
{:else if !isAccessible}
  <div class="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
    <p class="text-sm">{$t('plugins.plugin_disabled_desc')}</p>
    <a href={$currentOrgPath} class="text-xs text-blue-600 hover:underline">
      {$t('plugins.back_to_dashboard')}
    </a>
  </div>
{:else if subLoader}
  {#await subLoader()}
    <div class="flex h-full items-center justify-center">
      <Loader2Icon class="size-6 animate-spin text-slate-400" />
    </div>
  {:then { default: PluginSubPage }}
    <PluginSubPage {orgSlug} />
  {:catch}
    <div class="flex h-full items-center justify-center text-sm text-red-500">{$t('plugins.load_error')}</div>
  {/await}
{:else}
  <div class="flex h-full items-center justify-center text-sm text-slate-400">
    {$t('plugins.empty')}
  </div>
{/if}
