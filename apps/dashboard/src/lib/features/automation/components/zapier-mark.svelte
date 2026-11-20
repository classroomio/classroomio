<script lang="ts">
  import { getZapierMonogramTextColor } from '$features/automation/utils/zapier-utils';

  interface Props {
    src: string;
    name: string;
    size?: 'sm' | 'md' | 'lg';
    fallbackColor?: string;
    fallbackText?: string;
  }

  let { src, name, size = 'md', fallbackColor = '#64748b', fallbackText }: Props = $props();

  let failedSrc = $state<string | null>(null);

  const hasFailed = $derived(failedSrc === src);
  const tileClass = $derived(size === 'sm' ? 'size-8 p-1.5' : size === 'lg' ? 'size-12 p-2.5' : 'size-10 p-2');
  const monogram = $derived(fallbackText ?? name.slice(0, 2));
</script>

{#if hasFailed}
  <span
    class="{tileClass} flex shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
    style="background-color: {fallbackColor}; color: {getZapierMonogramTextColor(fallbackColor)}"
    aria-hidden="true"
  >
    {monogram}
  </span>
{:else}
  <span
    class="{tileClass} ui:border-border flex shrink-0 items-center justify-center rounded-lg border bg-white"
    aria-hidden="true"
  >
    <img {src} alt="" class="size-full object-contain" loading="lazy" onerror={() => (failedSrc = src)} />
  </span>
{/if}
