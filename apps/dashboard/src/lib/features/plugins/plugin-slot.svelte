<script lang="ts">
  import { browser } from '$app/environment';
  import { appConfig } from '$lib/utils/config';
  import { orgCapabilitiesApi } from './store/org-capabilities.svelte';
  import { resolveActiveSlotLoaders, type SlotName } from '@cio/sdk';

  interface Props {
    name: SlotName;
    context?: Record<string, any>;
    class?: string;
  }

  let { name, context = {}, class: className = '' }: Props = $props();

  const components = $derived(
    resolveActiveSlotLoaders({
      slotName: name,
      plugins: appConfig.plugins,
      enabledCapabilities: orgCapabilitiesApi.enabledCapabilityIds
    })
  );
</script>

{#if browser && components.length > 0}
  <div class={className}>
    {#each components as loadComponent, index (`${name}-${index}`)}
      {#await loadComponent() then { default: Component }}
        <Component {...context} />
      {/await}
    {/each}
  </div>
{/if}
