<script lang="ts">
  import { currentOrg } from '$lib/utils/store/org';
  import { Button } from '@cio/ui/base/button';
  import { pluginsApi } from '../api/plugins.svelte';
  import type { StableContributionTarget } from '@cio/utils/validation/plugin';

  interface Props {
    target: StableContributionTarget | string;
    context?: Record<string, string | number | boolean | null | undefined>;
    className?: string;
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  }

  let { target, context = {}, className = '', variant = 'outline', size = 'default' }: Props = $props();

  let listedOrgId = '';

  $effect(() => {
    const orgId = $currentOrg.id;
    if (!orgId || orgId === listedOrgId) return;

    listedOrgId = orgId;
    void pluginsApi.listOrgContributions(orgId, target);
  });

  const matchingActions = $derived.by(() => {
    return pluginsApi.contributions.filter((contrib) => contrib.target === target && contrib.renderMode === 'host');
  });

  function interpolateUrl(template: string, ctx: Record<string, string | number | boolean | null | undefined>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      const val = ctx[key];
      return val !== null && val !== undefined ? encodeURIComponent(String(val)) : '';
    });
  }

  function handleActionClick(action: (typeof matchingActions)[number]) {
    if (action.actionType === 'openUrl' && action.urlTemplate) {
      const resolvedUrl = interpolateUrl(action.urlTemplate, context);
      window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (action.command) {
      window.dispatchEvent(
        new CustomEvent('cio:plugin:command', {
          detail: {
            command: action.command,
            pluginId: action.pluginId,
            installationId: action.installationId,
            context
          }
        })
      );
    }
  }
</script>

{#if matchingActions.length > 0}
  <div class="plugin-action-group flex flex-wrap items-center gap-2 {className}">
    {#each matchingActions as action (action.installationId + action.contributionId)}
      <Button {variant} {size} onclick={() => handleActionClick(action)} class="inline-flex items-center gap-2">
        {#if action.icon === 'linkedin'}
          <svg class="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37z"
            />
          </svg>
        {/if}
        <span>{action.label}</span>
      </Button>
    {/each}
  </div>
{/if}
