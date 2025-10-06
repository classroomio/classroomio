<script lang="ts">
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import FlashFilled from 'carbon-icons-svelte/lib/FlashFilled.svelte';
  import { isFreePlan } from '$lib/utils/store/org';

  interface Props {
    className?: string;
    onClick?: any;
    children?: import('svelte').Snippet;
  }

  let { className = '', onClick = () => {}, children }: Props = $props();
</script>

{#if $isFreePlan}
  <button
    class="flex w-full items-center gap-2 rounded-md border border-blue-700 bg-blue-50 px-2 py-2 transition-all ease-in-out hover:scale-95 {className}"
    onclick={() => {
      onClick();
      openUpgradeModal();
    }}
  >
    <FlashFilled size={16} class="text-blue-700" />
    <p class="text-sm font-semibold text-blue-700">
      {@render children?.()}
    </p>
  </button>
{/if}
