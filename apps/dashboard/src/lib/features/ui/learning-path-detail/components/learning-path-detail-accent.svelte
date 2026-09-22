<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';
  import UnlockIcon from '@lucide/svelte/icons/unlock';

  interface Props {
    gated: boolean;
    label: string;
  }

  let { gated, label }: Props = $props();
</script>

<span
  class="ui:text-muted-foreground ui:border-border inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs"
>
  {#if gated}
    <LockIcon class="size-3.5" />
  {:else}
    <UnlockIcon class="size-3.5" />
  {/if}
  {label}
</span>
