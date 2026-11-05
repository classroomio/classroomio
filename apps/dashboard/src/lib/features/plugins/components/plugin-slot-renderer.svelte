<script lang="ts">
  import { currentOrg } from '$lib/utils/store/org';
  import { pluginsApi } from '../api/plugins.svelte';
  import PluginHostFrame from './plugin-host-frame.svelte';
  import type { StableContributionTarget } from '@cio/utils/validation/plugin';
  import type { PluginActionEvent, PluginResourceContext, ResolvedContributionItem } from '../utils/types';

  interface Props {
    target: StableContributionTarget | string;
    resource?: PluginResourceContext;
    className?: string;
    onAction?: (event: PluginActionEvent) => Promise<unknown> | unknown;
    onaction?: (event: PluginActionEvent) => Promise<unknown> | unknown;
  }

  let { target, resource, className = '', onAction, onaction }: Props = $props();

  const effectiveAction = $derived(onAction ?? onaction);
  let listedContributionKey = '';
  let contributions = $state<ResolvedContributionItem[]>([]);
  const resourceKey = $derived(resource ? `${resource.type}:${resource.id}:${resource.selectedTemplateId ?? ''}` : '');

  const activeInstallationIds = $derived(
    pluginsApi.installations
      .filter((i) => i.status === 'active')
      .map((i) => i.id)
      .sort()
      .join(',')
  );

  $effect(() => {
    const orgId = $currentOrg.id;
    const contributionKey = `${orgId}:${target}:${resource?.type ?? ''}:${resource?.id ?? ''}:${activeInstallationIds}`;
    if (!orgId || contributionKey === listedContributionKey) return;

    listedContributionKey = contributionKey;
    void pluginsApi.listOrgContributions(orgId, target).then((result) => {
      if ($currentOrg.id === orgId && listedContributionKey === contributionKey) contributions = result;
    });
  });

  const matchingSlots = $derived.by(() => {
    return contributions.filter((contrib) => {
      const isMatch = contrib.target === target && contrib.renderMode === 'custom' && contrib.artifactUrl;
      if (!isMatch) return false;
      const installation = pluginsApi.installations.find((inst) => inst.id === contrib.installationId);
      if (installation && installation.status !== 'active') return false;
      return true;
    });
  });
</script>

{#if matchingSlots.length > 0}
  <div class="plugin-slot-container flex flex-col gap-4 {className}">
    {#each matchingSlots as slot (slot.installationId + slot.contributionId + resourceKey)}
      <PluginHostFrame
        installationId={slot.installationId}
        pluginId={slot.pluginId}
        version={slot.version}
        contributionId={slot.contributionId}
        grantedScopes={slot.grantedScopes}
        organizationId={$currentOrg.id}
        srcUrl={slot.artifactUrl}
        title={slot.title}
        className="block w-full border-0"
        {target}
        {resource}
        onAction={effectiveAction}
      />
    {/each}
  </div>
{/if}
