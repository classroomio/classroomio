<script lang="ts">
  import InfoHint from './info-hint.svelte';

  interface Props {
    label: string;
    hint?: string;
  }

  let { label, hint }: Props = $props();
</script>

<span class="inline-flex items-center gap-1 whitespace-normal">
  <span>{label}</span>
  {#if hint}
    <InfoHint {hint} />
  {/if}
</span>
