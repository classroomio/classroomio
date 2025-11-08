<script>
  import { globalStore } from '$lib/utils/store/app';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg, currentOrgDomain, currentOrgPath } from '$lib/utils/store/org';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import RocketIcon from '@lucide/svelte/icons/rocket';
  import BellPlusIcon from '@lucide/svelte/icons/bell-plus';
  import { profileMenu } from '../store';
  import { t } from '$lib/utils/functions/translations';
  import { logout } from '$lib/utils/functions/logout';

  async function handleLogout() {
    await logout();
    closeMenu();
  }

  function closeMenu() {
    $profileMenu.open = false;
  }
</script>

<div class="cursor-pointer rounded-md px-2 py-2 md:px-4 md:py-4">
  <div class="space-y-4 border-b py-3">
    <p class="text-xs font-semibold text-gray-500">{$t('profileMenu.profile')}</p>
    <a
      href={`${!$globalStore.isOrgSite ? $currentOrgPath : '/lms'}/settings`}
      class="flex items-center justify-between hover:no-underline"
      onclick={closeMenu}
    >
      <span class="flex max-w-[70%] items-center gap-2">
        <img src={$profile.avatar_url} alt="profile" class="h-8 w-8 rounded-full" />
        <div>
          <p class="w-[80%] truncate text-sm font-semibold">{$profile.fullname}</p>
          <p class="w-[80%] truncate text-xs">{$profile.email}</p>
        </div>
      </span>
      <div>
        <SettingsIcon size={16} />
      </div>
    </a>
  </div>
  {#if !$globalStore.isOrgSite}
    <div class="space-y-4 border-b py-3">
      <p class="text-xs font-semibold text-gray-500">{$t('profileMenu.current_org')}</p>
      <a
        href={`${$currentOrgPath}/settings?tab=org`}
        class="flex items-center justify-between hover:no-underline"
        onclick={closeMenu}
      >
        <span class="flex max-w-[70%] items-center gap-2">
          {#if $currentOrg.avatar_url && $currentOrg.name}
            <Avatar src={$currentOrg.avatar_url} name={$currentOrg.name} shape="rounded-md" width="w-7" height="h-7" />
          {:else if $currentOrg.shortName}
            <TextChip size="sm" value={$currentOrg.shortName} className="bg-primary-200 dark:text-black font-medium" />
          {/if}
          <div>
            <p class="w-[80%] truncate text-sm font-semibold">{$currentOrg.name}</p>
            <p class="w-[80%] truncate text-xs">
              {$currentOrgDomain}
            </p>
          </div>
        </span>
        <div>
          <SettingsIcon size={16} />
        </div>
      </a>
    </div>
  {/if}

  <div class="space-y-4 border-b py-3">
    <p class="text-xs font-semibold text-gray-500">{$t('profileMenu.free_tools')}</p>
    <a
      href="https://classroomio.com/tools/progress"
      target="_blank"
      class="flex items-center gap-2"
      onclick={closeMenu}
    >
      <img src="/progress.svg" alt="progress" class="h-6 w-6 rounded-full" />
      <p class="text-sm font-semibold">{$t('profileMenu.progress')}</p>
    </a>
    <a
      href="https://classroomio.com/tools/activity-stopwatch"
      target="_blank"
      class=" flex items-center gap-2"
      onclick={closeMenu}
    >
      <img src="/timer.svg" alt="timer" class="h-6 w-6 rounded-full" />
      <p class="text-sm font-semibold">{$t('profileMenu.timer')}</p>
    </a>
    <a
      href="https://classroomio.com/tools/tic-tac-toe"
      target="_blank"
      class=" flex items-center gap-2"
      onclick={closeMenu}
    >
      <img src="/tictac.svg" alt="tic_tac_toe" class="h-6 w-6 rounded-full" />
      <p class="text-sm font-semibold">{$t('profileMenu.tic_tac')}</p>
    </a>
    <a
      href="https://classroomio.com/tools"
      onclick={closeMenu}
      target="_blank"
      class="ml-auto flex w-fit items-center justify-end"
    >
      <div class="flex items-center gap-1 text-xs font-semibold text-blue-900">
        {$t('profileMenu.see_more')}
        <ChevronDownIcon size={16} class="text-blue-900" />
      </div>
    </a>
  </div>
  {#if !$globalStore.isOrgSite}
    <div class="space-y-4 border-b py-3">
      <a
        href="https://classroomio.com/roadmap"
        target="_blank"
        onclick={closeMenu}
        class="flex items-center gap-2 hover:no-underline"
      >
        <BellPlusIcon size={16} />
        <p class="text-sm font-semibold">{$t('profileMenu.whats_new')}</p>
      </a>
      <a
        href="https://classroomio.com/blog/launch-week"
        target="_blank"
        onclick={closeMenu}
        class="flex items-center gap-2 hover:no-underline"
      >
        <RocketIcon size={16} />
        <p class="text-sm font-semibold">{$t('profileMenu.launch_week')}</p>
      </a>
    </div>
  {/if}

  <button onclick={handleLogout} class="w-full space-y-4 pt-3">
    <span class="flex items-center gap-2">
      <LogOutIcon size={16} />
      <p class="text-sm font-semibold">{$t('settings.profile.logout')}</p>
    </span>
  </button>
</div>
