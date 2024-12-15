<script lang="ts">
  import { cn } from '$lib/utils';
  let { src, alt, className = '' } = $props();
</script>

<a href="/#" class={cn('w-20', className)}>
  <img
    src={src || '/logo.png'}
    alt={alt || 'logo'}
    class="mx-auto inline-block rounded text-white"
  />
</a>
