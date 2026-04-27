<script lang="ts">
  let { src = null, alt = '', className = '' }: { src?: string | null; alt?: string; className?: string } = $props();
</script>

{#if src}
  <img {src} {alt} class={`cio-img-cover ${className}`} loading="lazy" />
{:else}
  <span class={`cio-thumb-fallback ${className}`} aria-hidden="true"></span>
{/if}
