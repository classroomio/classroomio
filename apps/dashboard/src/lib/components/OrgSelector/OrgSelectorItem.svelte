<script lang="ts">
  import * as Command from '@cio/ui/base/command';
  import SquarePlus from '@lucide/svelte/icons/square-plus';

  import TextChip from '../Chip/Text.svelte';
  import ComingSoon from '../ComingSoon/index.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';

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

<!-- <svelte:document onkeydown={handleKeydown} /> -->

<div class="relative">
  <Command.Item class="h-12">
    <button
      class="w-full {disabled &&
        'm-1 border-t opacity-25'} flex w-56 items-center gap-2 text-start text-sm {hasDivider &&
        'border-b border-gray-100 dark:border-neutral-600'}"
      onclick={disabled ? undefined : onClick}
    >
      {#if avatar}
        <Avatar
          src={avatar}
          name={text}
          shape="rounded-md"
          width="w-[1.2rem]"
          height="h-[1.2rem]"
          className="mr-2 border-4 border-red-500"
        />
      {:else if avatarText}
        <TextChip value={avatarText} className="mr-2 bg-primary-200 font-medium text-xs dark:text-black" {size} />
      {/if}

      {#if disabled}
        <SquarePlus />
      {/if}

      {text}
    </button>

    <!-- <Command.Shortcut>⌘P</Command.Shortcut> -->
  </Command.Item>

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
    top: -5px;
    right: 5px;
  }
</style>
