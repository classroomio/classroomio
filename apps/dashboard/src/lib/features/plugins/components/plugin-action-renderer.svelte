<script lang="ts">
  import { currentOrg } from '$lib/utils/store/org';
  import { Button } from '@cio/ui/base/button';
  import { pluginsApi } from '../api/plugins.svelte';
  import PluginIcon from './plugin-icon.svelte';
  import { resolvePluginActionUrl } from '../utils/plugin-actions';
  import type { ResolvedContributionItem } from '../utils/types';
  import type { StableContributionTarget } from '@cio/utils/validation/plugin';

  interface Props {
    target: StableContributionTarget | string;
    context?: Record<string, string | number | boolean | null | undefined>;
    className?: string;
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  }

  let { target, context = {}, className = '', variant = 'outline', size = 'default' }: Props = $props();

  let listedKey = '';
  let contributions = $state<ResolvedContributionItem[]>([]);

  const activeInstallationIds = $derived(
    pluginsApi.installations
      .filter((i) => i.status === 'active')
      .map((i) => i.id)
      .sort()
      .join(',')
  );

  $effect(() => {
    const orgId = $currentOrg.id;
    const key = `${orgId}:${target}:${activeInstallationIds}`;
    if (!orgId || key === listedKey) return;

    listedKey = key;
    void pluginsApi.listOrgContributions(orgId, target).then((result) => {
      if ($currentOrg.id === orgId && key === listedKey) contributions = result;
    });
  });

  const matchingActions = $derived.by(() => {
    return contributions.filter((contrib) => {
      const isMatch = contrib.target === target && contrib.renderMode === 'host';
      if (!isMatch) return false;
      const installation = pluginsApi.installations.find((inst) => inst.id === contrib.installationId);
      if (installation && installation.status !== 'active') return false;
      return true;
    });
  });

  function handleActionClick(action: (typeof matchingActions)[number]) {
    if (action.actionType === 'openUrl' && action.urlTemplate) {
      const resolvedUrl = resolvePluginActionUrl(action.urlTemplate, context, action.allowedDomains ?? []);
      if (!resolvedUrl) return;

      window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
      return;
    }
  }
</script>

{#if matchingActions.length > 0}
  <div class="plugin-action-group flex flex-wrap items-center gap-2 {className}">
    {#each matchingActions as action (action.installationId + action.contributionId)}
      <Button {variant} {size} onclick={() => handleActionClick(action)} class="inline-flex items-center gap-2">
        <PluginIcon src={action.iconUrl} alt={action.label ?? action.id} />
        <span>{action.label}</span>
      </Button>
    {/each}
  </div>
{/if}
