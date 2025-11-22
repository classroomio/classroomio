<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import { getShortOrgName } from '$lib/utils/functions/org';

  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg, currentOrgDomain, currentOrgPath } from '$lib/utils/store/org';

  import TextChip from '$lib/components/Chip/Text.svelte';
  import Menu from '$lib/components/Org/FooterMenu/Menu.svelte';

  let { user }: { user: { name: string; email: string | null; avatar: string | null } } = $props();

  const sidebar = useSidebar();
</script>

<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton
            size="lg"
            class="ui:data-[state=open]:bg-sidebar-accent ui:data-[state=open]:text-sidebar-accent-foreground"
            {...props}
          >
            <Avatar.Root class="size-8 rounded-lg">
              <Avatar.Image src={user.avatar} alt={user.name} />
              <Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{user.name}</span>
              <span class="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon class="ml-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="ui:w-(--bits-dropdown-menu-anchor-width) ui:min-w-56 ui:rounded-lg"
        side={sidebar.isMobile ? 'bottom' : 'right'}
        align="end"
        sideOffset={4}
      >
        <DropdownMenu.Label class="p-0 font-normal">
          <a
            href={`${!$globalStore.isOrgSite ? $currentOrgPath : '/lms'}/settings`}
            class="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
          >
            <Avatar.Root class="size-8 rounded-lg">
              <Avatar.Image src={user.avatar} alt={user.name} />
              <Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
            </Avatar.Root>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{user.name}</span>
              <span class="truncate text-xs">{user.email}</span>
            </div>
          </a>
        </DropdownMenu.Label>

        {#if !$globalStore.isOrgSite}
          <DropdownMenu.Separator />

          <DropdownMenu.Label class="p-0 font-normal">
            <a
              href={`${$currentOrgPath}/settings?tab=org`}
              class="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
            >
              <Avatar.Root class="size-8 rounded-lg">
                {#if $currentOrg.avatarUrl}
                  <Avatar.Image src={$currentOrg.avatarUrl} alt={$currentOrg.name} />
                {:else}
                  <TextChip
                    size="sm"
                    value={getShortOrgName($currentOrg.name)}
                    className="bg-primary-200 dark:text-black"
                  />
                {/if}
              </Avatar.Root>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">{$currentOrg.name}</span>
                <span class="truncate text-xs">{$currentOrgDomain}</span>
              </div>
            </a>
          </DropdownMenu.Label>
          <DropdownMenu.Separator />
        {/if}

        <DropdownMenu.Group>
          <Menu />
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>

<style>
  a {
    text-decoration: none;
  }
</style>
