<script>
  import TextChip from '../Chip/Text.svelte';

  export let size;
  export let hasDivider = false;
  export let active = false;
  export let avatarText = '';
  export let text = '';
  export let onClick;
</script>

<button
  class="flex items-center w-60 py-2 px-3 {hasDivider &&
    'border-b border-gray-200'} {active && 'bg-blue-100'}"
  on:click={onClick}
>
  {#if avatarText}
    <TextChip value={avatarText} className="mr-2" {size} />
  {/if}
  {text}
</button>

<style>
  button {
    min-height: 56px;
  }
</style>
