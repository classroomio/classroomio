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
  }

  let { target, resource, className = '', onAction }: Props = $props();

  let listedContributionKey = '';
  let contributions = $state<ResolvedContributionItem[]>([]);
  const resourceKey = $derived(resource ? JSON.stringify(resource) : '');

  $effect(() => {
    const orgId = $currentOrg.id;
    const contributionKey = `${orgId}:${target}:${resource?.type ?? ''}:${resource?.id ?? ''}`;
    if (!orgId || contributionKey === listedContributionKey) return;

    listedContributionKey = contributionKey;
    void pluginsApi.listOrgContributions(orgId, target).then((result) => {
      if ($currentOrg.id === orgId && listedContributionKey === contributionKey) contributions = result;
    });
  });

  const matchingSlots = $derived.by(() => {
    return contributions.filter(
      (contrib) => contrib.target === target && contrib.renderMode === 'custom' && contrib.artifactUrl
    );
  });
</script>

{#if matchingSlots.length > 0}
  <div class="plugin-slot-container flex flex-col gap-4 {className}">
    {#each matchingSlots as slot (slot.installationId + slot.contributionId + resourceKey)}
      <PluginHostFrame
        installationId={slot.installationId}
        pluginId={slot.pluginId}
        version={slot.version}
        organizationId={$currentOrg.id}
        srcUrl={slot.artifactUrl}
        title={slot.title}
        backendAudience={slot.backendAudience}
        className="block w-full border-0"
        {target}
        {resource}
        {onAction}
      />
    {/each}
  </div>
{/if}
