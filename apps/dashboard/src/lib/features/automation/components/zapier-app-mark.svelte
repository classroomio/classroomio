<script lang="ts">
  import type { TZapierPartnerApp } from '@cio/utils/constants/zapier';

  import ZapierMark from '$features/automation/components/zapier-mark.svelte';
  import { getZapierAppLogoUrl, getZapierAppMonogram } from '$features/automation/utils/zapier-utils';

  interface Props {
    app: TZapierPartnerApp;
    size?: 'sm' | 'md' | 'lg';
  }

  let { app, size = 'md' }: Props = $props();
</script>

<ZapierMark
  src={getZapierAppLogoUrl(app)}
  name={app.name}
  {size}
  fallbackColor={app.color}
  fallbackText={getZapierAppMonogram(app)}
/>
