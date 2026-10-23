<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '$lib/utils/functions/translations';

  import { formatUpdatedAgo } from '../utils/insights-utils';

  interface Props {
    generatedAt: string | null;
  }

  let { generatedAt }: Props = $props();

  let now = $state(Date.now());

  onMount(() => {
    const timer = setInterval(() => (now = Date.now()), 1000);

    return () => clearInterval(timer);
  });

  const label = $derived(formatUpdatedAgo(generatedAt, now, $t));
</script>

{#if label}
  <span class="ui:text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums">
    <span class="size-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
    {label}
  </span>
{/if}
