<script lang="ts">
  import SunIcon from '@lucide/svelte/icons/sun';
  import MoonIcon from '@lucide/svelte/icons/moon';

  import { resetMode, setMode } from 'mode-watcher';
  import * as DropdownMenu from '../dropdown-menu';
  import { buttonVariants } from '../button';
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class={buttonVariants({ variant: 'outline', size: 'icon' })}>
    <SunIcon
      class="ui:h-[1.2rem] ui:w-[1.2rem] ui:rotate-0 ui:scale-100 ui:dark:-rotate-90 ui:dark:scale-0 !transition-all"
    />
    <MoonIcon
      class="ui:absolute ui:h-[1.2rem] ui:w-[1.2rem] ui:rotate-90 ui:scale-0 ui:dark:rotate-0 ui:dark:scale-100 !transition-all"
    />
    <span class="sr-only">Toggle theme</span>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onclick={() => setMode('light')}>Light</DropdownMenu.Item>
    <DropdownMenu.Item onclick={() => setMode('dark')}>Dark</DropdownMenu.Item>
    <DropdownMenu.Item onclick={() => resetMode()}>System</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
