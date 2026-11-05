<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { currentOrg, currentOrgPath, isOrgTeamMember } from '$lib/utils/store/org';
  import { pluginsApi } from '$features/plugins';
  import { PluginHostFrame } from '$features/plugins/components';
  import type { ResolvedContributionItem } from '$features/plugins/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import BlocksIcon from '@lucide/svelte/icons/blocks';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  let listedOrganizationId = '';
  let contributions = $state<ResolvedContributionItem[]>([]);

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId) return;

    if ($isOrgTeamMember === false) {
      void goto($currentOrgPath);
      return;
    }

    if (listedOrganizationId === organizationId) return;

    listedOrganizationId = organizationId;
    void pluginsApi.listOrgInstallations(organizationId);
    void pluginsApi.listOrgContributions(organizationId, 'plugin.page').then((result) => {
      if ($currentOrg.id === organizationId) contributions = result;
    });
  });

  const installation = $derived(
    pluginsApi.installations.find(
      (inst) => inst.pluginId === page.params.pluginId || inst.plugin?.slug === page.params.pluginId
    )
  );

  const contribution = $derived(
    contributions.find(
      (item) =>
        (item.pluginId === page.params.pluginId ||
          item.pluginSlug === page.params.pluginId ||
          item.pluginId === installation?.pluginId) &&
        item.contributionId === page.params.pageId &&
        item.target === 'plugin.page' &&
        item.artifactUrl
    )
  );
</script>

<div class="flex h-full w-full flex-col">
  {#if !installation && pluginsApi.loading}
    <div class="flex h-96 flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2Icon class="size-6 animate-spin text-blue-500" />
      <span class="text-sm">{$t('plugins.loading')}</span>
    </div>
  {:else if !contribution}
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
  {:else if contribution.artifactUrl}
    <div class="flex h-[calc(100vh-3.5rem)] w-full flex-col overflow-hidden">
      <PluginHostFrame
        installationId={contribution.installationId}
        pluginId={contribution.pluginId}
        version={contribution.version}
        organizationId={$currentOrg.id}
        srcUrl={contribution.artifactUrl}
        title={contribution.title}
        target="plugin.page"
        resource={{ type: 'organization', id: $currentOrg.id }}
        className="h-full w-full border-0"
      />
    </div>
  {/if}
</div>
