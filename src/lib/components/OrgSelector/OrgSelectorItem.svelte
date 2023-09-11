<script>
  import Avatar from '$lib/components/Avatar/index.svelte';
  import TextChip from '../Chip/Text.svelte';
  import ComingSoon from '../ComingSoon/index.svelte';

  export let size = '';
  export let hasDivider = false;
  export let active = false;
  export let avatar = '';
  export let avatarText = '';
  export let text = '';
  export let onClick = () => {};
  export let disabled = false;
</script>

<div class="relative">
  <button
    class="{disabled && 'opacity-25'} flex items-center w-60 py-2 px-3 {hasDivider &&
      'border-b border-gray-100'} {active && 'bg-primary-100 dark:bg-gray-500'}"
    on:click={onClick}
  >
    {#if avatar}
      <Avatar
        src={avatar}
        name={text}
        shape="rounded-md"
        width="w-7"
        height="h-7"
        className="mr-2"
      />
    {:else if avatarText}
      <TextChip
        value={avatarText}
        className="mr-2 bg-primary-200 font-bold dark:bg-gray-600"
        {size}
      />
    {/if}
    {text}
  </button>
  {#if disabled}
    <div class="coming-soon">
      <ComingSoon />
    </div>
  {/if}
</div>

<style>
  button {
    min-height: 56px;
  }

  .coming-soon {
    position: absolute;
    top: 5px;
    right: 5px;
  }
</style>
