<script lang="ts">
  import { globalStore } from '$lib/utils/store/app';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import BellPlusIcon from '@lucide/svelte/icons/bell-plus';
  import BadgeHelpIcon from '@lucide/svelte/icons/badge-help';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import * as Avatar from '@cio/ui/base/avatar';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import ThemeToggle from './theme-toggle.svelte';

  import { currentOrg, currentOrgDomain, currentOrgPath } from '$lib/utils/store/org';

  import { t } from '$lib/utils/functions/translations';
  import { logout } from '$lib/utils/functions/logout';
  import { profile } from '$lib/utils/store/user';

  const sidebar = useSidebar();
</script>

<!--

  SNIPPETS

-->
{#snippet avatarblock()}
  <Avatar.Root>
    <Avatar.Image src={$profile.avatarUrl} alt={$profile.fullname} />
    <Avatar.Fallback class="rounded-lg">{$profile.fullname.slice(0, 2)}</Avatar.Fallback>
  </Avatar.Root>
  <div class="grid flex-1 text-left text-sm leading-tight">
    <span class="truncate font-medium">{$profile.fullname}</span>
    <span class="truncate text-xs">{$profile.email}</span>
  </div>
{/snippet}

{#snippet usertrigger()}
  <DropdownMenu.Label class="p-0 font-normal">
    <a
      href={`${!$globalStore.isOrgSite ? $currentOrgPath : '/lms'}/settings`}
      class="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
    >
      {@render avatarblock()}
    </a>
  </DropdownMenu.Label>
{/snippet}

{#snippet orgtrigger()}
  <DropdownMenu.Label class="p-0 font-normal">
    <a href={`${$currentOrgPath}/settings?tab=org`} class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
      <Avatar.Root>
        <Avatar.Image src={$currentOrg.avatarUrl} alt={$currentOrg.name} />
        <Avatar.Fallback class="rounded-lg">{$currentOrg.name.slice(0, 2)}</Avatar.Fallback>
      </Avatar.Root>
      <div class="grid flex-1 text-left text-sm leading-tight">
        <span class="truncate font-medium">{$currentOrg.name}</span>
        <span class="truncate text-xs">{$currentOrgDomain}</span>
      </div>
    </a>
  </DropdownMenu.Label>
{/snippet}

{#snippet themetoggle()}
  <DropdownMenu.Label class="p-0 font-normal">
    <ThemeToggle />
  </DropdownMenu.Label>
{/snippet}

<!--

  COMPONENT

-->
<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <!-- DROPDOWN TRIGGER -->
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton
            size="lg"
            class="ui:data-[state=open]:bg-sidebar-accent ui:data-[state=open]:text-sidebar-accent-foreground"
            {...props}
          >
            {@render avatarblock()}
            <ChevronsUpDownIcon class="ml-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>

      <!-- DROPDOWN CONTENT -->
      <DropdownMenu.Content
        class="ui:w-(--bits-dropdown-menu-anchor-width) ui:min-w-56 ui:rounded-lg"
        side={sidebar.isMobile ? 'bottom' : 'right'}
        align="end"
        sideOffset={4}
      >
        {@render usertrigger()}

        {#if !$globalStore.isOrgSite}
          <DropdownMenu.Separator />
          {@render orgtrigger()}
        {/if}

        <DropdownMenu.Separator />
        {@render themetoggle()}

        <DropdownMenu.Separator />

        <DropdownMenu.Group>
          <div class="cursor-pointer space-y-2">
            {#if !$globalStore.isOrgSite}
              <div class="space-y-4">
                <DropdownMenu.Item class="m-0">
                  <a href="https://classroomio.com/roadmap" target="_blank" class="flex w-full items-center gap-2">
                    <BellPlusIcon size={16} />
                    <p class="text-sm">{$t('profileMenu.whats_new')}</p>
                  </a>
                </DropdownMenu.Item>

                <DropdownMenu.Item class="m-0">
                  <a
                    href="https://classroomio.com/blog/launch-week"
                    target="_blank"
                    class="flex w-full items-center gap-2"
                  >
                    <RocketIcon size={16} />
                    <p class="text-sm">{$t('profileMenu.launch_week')}</p>
                  </a>
                </DropdownMenu.Item>

                <DropdownMenu.Item class="m-0">
                  <a href={$currentOrgPath} class="flex h-full w-full items-center justify-start space-x-2 text-start">
                    <BadgeHelpIcon size={20} />
                    <p class="text-sm dark:text-white">{$t('org_navigation.help')}</p>
                  </a>
                </DropdownMenu.Item>
              </div>
            {/if}

            <DropdownMenu.Separator />

            <DropdownMenu.Item onclick={() => logout()}>
              <span class="flex items-center gap-2">
                <LogOutIcon />
                <p class="text-sm">{$t('settings.profile.logout')}</p>
              </span>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>
