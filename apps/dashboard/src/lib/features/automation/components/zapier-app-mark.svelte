<script lang="ts">
  import type { TZapierPartnerApp } from '@cio/utils/constants/zapier';

  import { getZapierAppMonogram, getZapierMonogramTextColor } from '$features/automation/utils/zapier-utils';

  interface Props {
    app: TZapierPartnerApp;
    size?: 'sm' | 'md' | 'lg';
    /** Zapier-hosted logo, when available. Falls back to the branded monogram. */
    logoUrl?: string | null;
  }

  let { app, size = 'md', logoUrl = null }: Props = $props();

  const sizeClass = $derived(
    size === 'sm' ? 'size-9 text-xs' : size === 'lg' ? 'size-11 text-base' : 'size-10 text-sm'
  );
</script>

{#if logoUrl}
  <img src={logoUrl} alt="" class="{sizeClass} shrink-0 rounded-lg object-contain" loading="lazy" />
{:else}
  <span
    class="{sizeClass} flex shrink-0 items-center justify-center rounded-lg font-semibold"
    style="background-color: {app.color}; color: {getZapierMonogramTextColor(app.color)}"
    aria-hidden="true"
  >
    {getZapierAppMonogram(app)}
  </span>
{/if}
