<script lang="ts">
  import { currentOrg } from '$lib/utils/store/org';
  import { pluginsApi } from '../api/plugins.svelte';
  import PluginHostFrame from './plugin-host-frame.svelte';
  import type { StableContributionTarget } from '@cio/utils/validation/plugin';

  interface Props {
    target: StableContributionTarget | string;
    context?: Record<string, unknown>;
    className?: string;
  }

  let { target, context = {}, className = '' }: Props = $props();

  let listedOrgId = '';

  $effect(() => {
    const orgId = $currentOrg.id;
    if (!orgId || orgId === listedOrgId) return;

    listedOrgId = orgId;
    void pluginsApi.listOrgContributions(orgId, target);
  });

  const matchingSlots = $derived.by(() => {
    return pluginsApi.contributions.filter(
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
        orgSlug={$currentOrg.siteName}
        srcUrl={slot.artifactUrl}
        title={slot.title}
      />
    {/each}
  </div>
{/if}
