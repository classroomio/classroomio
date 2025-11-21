<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import * as Command from '@cio/ui/base/command';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';

  import { profile } from '$lib/utils/store/user';

  import Menu from '../FooterMenu/Menu.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';

  let open = $state(false);
</script>

<div class="flex w-full items-center">
  <Popover.Root bind:open>
    <Popover.Trigger class="w-full">
      <button
        class="flex w-full items-center justify-between rounded-md p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-800"
        onclick={(e) => {
          e.stopPropagation();
          open = !open;
        }}
      >
        <div class="flex w-full items-center justify-start space-x-2 text-start">
          <Avatar src={$profile.avatar_url} name={$profile.username} width="w-[1.2rem]" height="h-[1.2rem]" />
          <p class="max-w-full truncate text-sm font-medium dark:text-white">
            {$profile.fullname}
          </p>
        </div>

        <ChevronsUpDownIcon size={16} />
      </button>
    </Popover.Trigger>

    <Popover.Content class="w-[200px] p-0" side="right" align="start">
      <Command.Root>
        <Command.List>
          <Menu />
        </Command.List>
      </Command.Root>
    </Popover.Content>
  </Popover.Root>
</div>
