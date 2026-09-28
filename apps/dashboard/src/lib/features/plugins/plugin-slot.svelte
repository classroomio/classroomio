<script lang="ts">
  import { browser } from '$app/environment';
  import { appConfig } from '$lib/utils/config';
  import { orgCapabilitiesApi } from './store/org-capabilities.svelte';
  import { resolveActiveSlotLoaders, type SlotName } from '@cio/sdk';
  import { isCourseLearnerView, isOrgStudent, isStudentExperience } from '$lib/utils/store/app';

  interface Props {
    name: SlotName;
    context?: Record<string, any>;
    class?: string;
  }

  let { name, context = {}, class: className = '' }: Props = $props();

  const isLearner = $derived(Boolean($isCourseLearnerView || $isOrgStudent || $isStudentExperience));

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
        <Component {isLearner} {...context} />
      {/await}
    {/each}
  </div>
{/if}
