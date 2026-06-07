<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import { basePath, globalStore } from '$lib/utils/store/app';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import BellPlusIcon from '@lucide/svelte/icons/bell-plus';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import BadgeHelpIcon from '@lucide/svelte/icons/badge-help';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import MessageSquarePlusIcon from '@lucide/svelte/icons/message-square-plus';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import ThemeToggle from './theme-toggle.svelte';

  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { showUserJotWidget } from '$lib/utils/services/userjot';
  import { ROLE } from '@cio/utils/constants';

  const SUPPORT_EMAIL = 'help@classroomio.com';
  const DOCS_URL = 'https://classroomio.com/docs';

  const sidebar = useSidebar();

  function getRoleLabel(roleId: number): string {
    if (roleId === ROLE.ADMIN) return $t('course.navItem.people.roles.admin');
    if (roleId === ROLE.TUTOR) return $t('course.navItem.people.roles.tutor');
    if (roleId === ROLE.STUDENT) return $t('course.navItem.people.roles.student');
    return '';
  }
</script>

<!--

  SNIPPETS

-->
{#snippet avatarblock()}
  <UserAvatar src={$profile.avatarUrl} alt={$profile.fullname} />
  <div class="grid flex-1 text-left text-sm leading-tight font-normal">
    <span class="truncate">{$profile.fullname}</span>
    <span class="truncate text-xs">{$profile.email}</span>
  </div>
{/snippet}

{#snippet triggeravatar()}
  <UserAvatar src={$profile.avatarUrl} alt={$profile.fullname} />
  <div class="grid flex-1 text-left text-sm leading-tight font-normal">
    <span class="truncate">{$profile.fullname}</span>
    <span class="truncate text-xs">{getRoleLabel($currentOrg.roleId)}</span>
  </div>
{/snippet}

{#snippet usertrigger()}
  <DropdownMenu.Label class="p-0">
    <a href={resolve(`${$basePath}/settings`, {})} class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
      <UserAvatar src={$profile.avatarUrl} alt={$profile.fullname} />
      <div class="grid flex-1 text-left text-sm leading-tight font-normal">
        <span class="truncate">{$profile.fullname}</span>
        <span class="truncate text-xs">{$profile.email}</span>
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
            {@render triggeravatar()}
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

        <DropdownMenu.Separator />
        {@render themetoggle()}

        <DropdownMenu.Separator />

        <DropdownMenu.Group>
          <div class="cursor-pointer space-y-2">
            {#if !$globalStore.isOrgSite}
              <div class="space-y-4">
                <DropdownMenu.Item class="m-0" onclick={() => showUserJotWidget('updates')}>
                  <span class="flex w-full items-center gap-2">
                    <BellPlusIcon size={16} />
                    <p class="text-sm">{$t('profileMenu.whats_new')}</p>
                  </span>
                </DropdownMenu.Item>

                <DropdownMenu.Item class="m-0" onclick={() => showUserJotWidget('feedback')}>
                  <span class="flex w-full items-center gap-2">
                    <MessageSquarePlusIcon size={16} />
                    <p class="text-sm">{$t('profileMenu.feedback')}</p>
                  </span>
                </DropdownMenu.Item>

                <DropdownMenu.Item class="m-0">
                  <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" class="flex w-full items-center gap-2">
                    <BookOpenIcon size={16} />
                    <p class="text-sm">{$t('profileMenu.documentation')}</p>
                  </a>
                </DropdownMenu.Item>

                <DropdownMenu.Item class="m-0">
                  <a href="mailto:{SUPPORT_EMAIL}" class="flex w-full items-center gap-2">
                    <BadgeHelpIcon size={16} />
                    <p class="text-sm">{$t('profileMenu.need_help')}</p>
                  </a>
                </DropdownMenu.Item>
              </div>
            {/if}

            <DropdownMenu.Separator />

            <DropdownMenu.Item onclick={() => goto(resolve(`/logout`, {}))}>
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
