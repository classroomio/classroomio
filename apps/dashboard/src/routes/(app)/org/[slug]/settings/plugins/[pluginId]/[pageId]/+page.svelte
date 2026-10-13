<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { currentOrg, currentOrgPath, isOrgAdmin } from '$lib/utils/store/org';
  import { pluginsApi } from '$features/plugins/api/plugins.svelte';
  import { PluginHostFrame } from '$features/plugins/components';
  import type { ResolvedContributionItem } from '$features/plugins/utils/types';

  let listedOrganizationId = '';
  let contributions = $state<ResolvedContributionItem[]>([]);

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId) return;

    if (!$isOrgAdmin) {
      void goto($currentOrgPath);
      return;
    }

    if (listedOrganizationId === organizationId) return;

    listedOrganizationId = organizationId;
    void pluginsApi.listOrgContributions(organizationId, 'plugin.page').then((result) => {
      if ($currentOrg.id === organizationId) contributions = result;
    });
  });

  const contribution = $derived(
    contributions.find(
      (item) =>
        item.pluginId === page.params.pluginId &&
        item.contributionId === page.params.pageId &&
        item.target === 'plugin.page' &&
        item.artifactUrl
    )
  );
</script>

{#if contribution?.artifactUrl}
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
    className="min-h-[70vh] w-full border-0"
  />
{/if}
