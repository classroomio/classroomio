<script lang="ts">
  import { cn } from '$lib/utils';

  let { src, alt, className = '', addAcademy = false } = $props();
</script>

<a href="/#" class="flex flex-row items-center gap-1">
  <figure class={cn('w-20', className)}>
    <img {src} {alt} class="mx-auto inline-block rounded text-white" />
  </figure>

  {#if addAcademy}
    <span class="text-lg font-semibold italic">Academy</span>
  {/if}
</a>
