<script lang="ts">
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import FlashFilled from 'carbon-icons-svelte/lib/FlashFilled.svelte';

  export let className = '';
  export let onClick = () => {};
</script>

<button
  class="w-full border bg-blue-50 border-blue-700 flex items-center gap-2 px-2 py-2 rounded-md hover:scale-95 transition-all ease-in-out {className}"
  on:click={() => {
    onClick();
    openUpgradeModal();
  }}
>
  <FlashFilled size={16} class="text-blue-700" />
  <p class="font-semibold text-blue-700 text-sm">
    <slot />
  </p>
</button>
