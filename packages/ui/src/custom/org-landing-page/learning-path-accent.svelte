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
  class="ui:inline-flex ui:shrink-0 ui:items-center ui:gap-1.5 ui:rounded-full ui:border ui:border-[var(--landing-border)] ui:px-2 ui:py-0.5 ui:text-xs ui:text-[var(--landing-fg-muted)] ui:[border-radius:var(--landing-radius-pill)]"
>
  {#if gated}
    <LockIcon class="ui:size-3.5" />
  {:else}
    <UnlockIcon class="ui:size-3.5" />
  {/if}
  {label}
</span>
