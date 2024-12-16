<script lang="ts">
  import { cn } from '$lib/utils';

  let { src, alt, className = '', addAcademy = false } = $props();
</script>

{#snippet logo(src = '/logo.png', alt = 'logo', className = '')}
  <a href="/#" class={cn('w-20', className)}>
    <img
      src={src}
      alt={alt}
      class="mx-auto inline-block rounded text-white"
    />
  </a>
{/snippet}

{#if addAcademy}
  <div class="flex flex-row items-center gap-1">
    {@render logo(src, alt, className)}
    <span class="mt-1 text-lg font-semibold italic">Academy</span>
  </div>
{:else}
  {@render logo(src, alt, className)}
{/if}
