<script lang="ts">
  import Avatar from '$lib/components/Avatar/index.svelte';
  import TextChip from '../Chip/Text.svelte';
  import ComingSoon from '../ComingSoon/index.svelte';

  interface Props {
    size?: string;
    hasDivider?: boolean;
    active?: boolean;
    avatar?: string;
    avatarText?: string;
    text?: string;
    onClick?: any;
    disabled?: boolean;
  }

  let {
    size = '',
    hasDivider = false,
    active = false,
    avatar = '',
    avatarText = '',
    text = '',
    onClick = () => {},
    disabled = false
  }: Props = $props();
</script>

<div class="relative">
  <button
    class="w-full {disabled && 'opacity-25'} flex w-[14rem] items-center px-2.5 py-1.5 text-start {hasDivider &&
      'border-b border-gray-100 dark:border-neutral-600'} {active && 'bg-gray-200 dark:bg-neutral-700 dark:text-white'}"
    onclick={disabled ? undefined : onClick}
  >
    {#if avatar}
      <Avatar src={avatar} name={text} shape="rounded-md" width="w-[1.2rem]" height="h-[1.2rem]" className="mr-2" />
    {:else if avatarText}
      <TextChip value={avatarText} className="mr-2 bg-primary-200 font-medium text-xs dark:text-black" {size} />
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
