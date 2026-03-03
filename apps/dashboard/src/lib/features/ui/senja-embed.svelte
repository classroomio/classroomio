<script lang="ts">
  import { embedSenjaWidget } from '@cio/utils/senja';
  import { LICENSE_FEATURE } from '@cio/utils/license';
  import { licenseFeatures } from '$lib/utils/store/license';
  import { onMount } from 'svelte';

  interface Props {
    id?: string;
  }

  let { id = '' }: Props = $props();

  const noTracking = $derived($licenseFeatures.includes(LICENSE_FEATURE.NO_TRACKING));

  onMount(() => {
    if (!noTracking && id) {
      embedSenjaWidget(id);
    }
  });
</script>

{#if !noTracking && id}
  <div class="senja-embed" data-id={id} data-lazyload="false" data-spinner="false"></div>
{/if}
