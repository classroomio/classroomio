<script lang="ts">
  import { page } from '$app/state';
  import { fade } from 'svelte/transition';
  import { cn } from '@cio/ui/tools';

  interface Props {
    id: string;
    children: import('svelte').Snippet;
  }

  let { id, children }: Props = $props();

  let includesHash = $derived(page.url.hash?.includes(id) ?? false);
</script>

<section
  {id}
  transition:fade={{ delay: 250, duration: 300 }}
  class={cn('border-b border-gray-300 pt-5 pb-5', includesHash && 'pt-22')}
>
  {@render children()}
</section>
