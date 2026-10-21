<script lang="ts">
  import type { Snippet } from 'svelte';
  import Eyebrow from './eyebrow.svelte';

  type HeadingSize = 'display' | 'h2' | 'h3';

  interface Props {
    eyebrow?: string;
    eyebrowClass?: string;
    lede?: string;
    ledeClass?: string;
    align?: 'center' | 'left';
    size?: HeadingSize;
    as?: 'h1' | 'h2' | 'h3';
    class?: string;
    titleClass?: string;
    title: Snippet;
    ledeContent?: Snippet;
  }

  let {
    eyebrow,
    eyebrowClass,
    lede,
    ledeClass = 'text-gray-600',
    align = 'center',
    size = 'h2',
    as = 'h2',
    class: className = '',
    titleClass = 'text-gray-950',
    title,
    ledeContent
  }: Props = $props();

  const HEADING_SIZE_CLASS: Record<HeadingSize, string> = {
    display: 'text-display',
    h2: 'text-h2',
    h3: 'text-h3'
  };

  const alignClass = $derived(align === 'center' ? 'items-center text-center' : 'items-start text-left');
  const hasLede = $derived(Boolean(lede || ledeContent));
</script>

<div class="flex flex-col {alignClass} {className}">
  {#if eyebrow}
    <Eyebrow class={eyebrowClass}>{eyebrow}</Eyebrow>
  {/if}

  <svelte:element this={as} class="text-balance {HEADING_SIZE_CLASS[size]} {titleClass}" class:mt-4={eyebrow}>
    {@render title()}
  </svelte:element>

  {#if hasLede}
    <p class="text-lead max-w-lede mt-[18px] text-pretty {ledeClass}">
      {#if ledeContent}
        {@render ledeContent()}
      {:else}
        {lede}
      {/if}
    </p>
  {/if}
</div>
