<script lang="ts">
  import { currentOrg } from '$lib/utils/store/org';
  import { pluginsApi } from '../api/plugins.svelte';
  import PluginHostFrame, { type PluginActionEvent } from './plugin-host-frame.svelte';
  import type { StableContributionTarget } from '@cio/utils/validation/plugin';
  import type { ResolvedContributionItem } from '../utils/types';

  interface Props {
    target: StableContributionTarget | string;
    resource?: {
      type: 'lesson' | 'course' | 'certificate' | 'organization';
      id: string;
    };
    className?: string;
    onAction?: (event: PluginActionEvent) => Promise<void> | void;
  }

  let { target, resource, className = '', onAction }: Props = $props();

  let listedContributionKey = '';
  let contributions = $state<ResolvedContributionItem[]>([]);

  $effect(() => {
    const orgId = $currentOrg.id;
    const resourceKey = resource ? `${resource.type}:${resource.id}` : '';
    const contributionKey = `${orgId}:${target}:${resourceKey}`;
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
    {#each matchingSlots as slot (slot.installationId + slot.contributionId)}
      <PluginHostFrame
        installationId={slot.installationId}
        pluginId={slot.pluginId}
        version={slot.version}
        organizationId={$currentOrg.id}
        srcUrl={slot.artifactUrl}
        title={slot.title}
        backendAudience={slot.backendAudience}
        {target}
        {resource}
        {onAction}
      />
    {/each}
  </div>
{/if}
