<script lang="ts">
  import { embedSenjaWidget } from '@cio/utils/senja';
  import { licenseApi } from '$features/license/api/license.svelte';

  interface Props {
    id: string;
    mode?: 'shadow' | 'iframe';
  }

  let { id = '', mode }: Props = $props();

  let isInitialized = $state(false);
  const noTracking = $derived(licenseApi.hasAccess('no-tracking'));

  $effect(() => {
    const shouldEmbed = !noTracking && !isInitialized;
    if (!shouldEmbed) {
      return;
    }

    isInitialized = true;
    embedSenjaWidget(id);
  });
</script>

{#if !noTracking}
  <div class="senja-embed" data-id={id} data-mode={mode} data-lazyload="false" data-spinner="false"></div>
{/if}
