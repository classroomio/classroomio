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
    class="w-full {disabled &&
      'opacity-25'} flex items-center text-start w-[14rem] py-1.5 px-2.5 {hasDivider &&
      'border-b border-gray-100 dark:border-neutral-600'} {active &&
      'bg-gray-200 dark:bg-neutral-700 dark:text-white'}"
    on:click={disabled ? undefined : onClick}
  >
    {#if avatar}
      <Avatar
        src={avatar}
        name={text}
        shape="rounded-md"
        width="w-[1.2rem]"
        height="h-[1.2rem]"
        className="mr-2"
      />
    {:else if avatarText}
      <TextChip
        value={avatarText}
        className="mr-2 bg-primary-200 font-medium text-xs dark:text-black"
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
