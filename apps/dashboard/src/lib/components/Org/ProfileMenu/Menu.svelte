<script>
  import { globalStore } from '$lib/utils/store/app';
  import { user, profile, defaultProfileState, defaultUserState } from '$lib/utils/store/user';
  import {
    currentOrg,
    orgs,
    defaultCurrentOrgState,
    currentOrgDomain,
    currentOrgPath
  } from '$lib/utils/store/org';
  import { ChevronDown, Settings } from 'carbon-icons-svelte';
  import Logout from 'carbon-icons-svelte/lib/Logout.svelte';
  import Rocket from 'carbon-icons-svelte/lib/Rocket.svelte';
  import NewTab from 'carbon-icons-svelte/lib/NewTab.svelte';
  import { goto } from '$app/navigation';
  import { profileMenu } from '../store';
  import { supabase } from '$lib/utils/functions/supabase';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { t } from '$lib/utils/functions/translations';
  import posthog from 'posthog-js';

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error logging out: ', error);
    }

    currentOrg.set(defaultCurrentOrgState);
    orgs.set([]);
    user.set(defaultUserState);
    profile.set(defaultProfileState);

    capturePosthogEvent('user_logged_out');
    posthog.reset();

    closeMenu();

    goto('/login');
  }

  function closeMenu() {
    $profileMenu.open = false;
  }
</script>

<div class="md:px-4 md:py-4 py-2 px-2 rounded-md cursor-pointer">
  <div class="border-b py-3 space-y-4">
    <p class="text-xs font-semibold text-gray-500">{$t('profileMenu.profile')}</p>
    <a
      href={`${!$globalStore.isOrgSite ? $currentOrgPath : '/lms'}/settings`}
      class="flex items-center justify-between hover:no-underline"
      on:click={closeMenu}
    >
      <span class="flex items-center gap-2 max-w-[70%]">
        <img src={$profile.avatar_url} alt="profile" class="h-8 w-8 rounded-full" />
        <div>
          <p class="text-sm font-semibold w-[80%] truncate">{$profile.fullname}</p>
          <p class="text-xs w-[80%] truncate">{$profile.email}</p>
        </div>
      </span>
      <div>
        <Settings size={20} />
      </div>
    </a>
  </div>
  {#if !$globalStore.isOrgSite}
    <div class="border-b py-3 space-y-4">
      <p class="text-xs font-semibold text-gray-500">{$t('profileMenu.current_org')}</p>
      <a
        href={`${$currentOrgPath}/settings?tab=org`}
        class="flex items-center justify-between hover:no-underline"
        on:click={closeMenu}
      >
        <span class="flex items-center gap-2 max-w-[70%]">
          <div
            class="flex items-center justify-center h-8 w-8 p-4 bg-blue-900 text-white font-semibold rounded-lg"
          >
            {$currentOrg.shortName}
          </div>
          <div>
            <p class="text-sm font-semibold w-[80%] truncate">{$currentOrg.name}</p>
            <p class="text-xs w-[80%] truncate">
              {$currentOrgDomain}
            </p>
          </div>
        </span>
        <div>
          <Settings size={20} />
        </div>
      </a>
    </div>
  {/if}

  <div class="border-b py-3 space-y-4">
    <p class="text-xs font-semibold text-gray-500">{$t('profileMenu.free_tools')}</p>
    <a
      href="https://classroomio.com/tools/progress"
      target="_blank"
      class="flex items-center gap-2"
      on:click={closeMenu}
    >
      <img src="/progress.svg" alt="progress" class="h-6 w-6 rounded-full" />
      <p class="text-sm font-semibold">{$t('profileMenu.progress')}</p>
    </a>
    <a
      href="https://classroomio.com/tools/activity-stopwatch"
      target="_blank"
      class=" flex items-center gap-2"
      on:click={closeMenu}
    >
      <img src="/timer.svg" alt="timer" class="h-6 w-6 rounded-full" />
      <p class="text-sm font-semibold">{$t('profileMenu.timer')}</p>
    </a>
    <a
      href="https://classroomio.com/tools/tic-tac-toe"
      target="_blank"
      class=" flex items-center gap-2"
      on:click={closeMenu}
    >
      <img src="/tictac.svg" alt="tic_tac_toe" class="h-6 w-6 rounded-full" />
      <p class="text-sm font-semibold">{$t('profileMenu.tic_tac')}</p>
    </a>
    <a
      href="https://classroomio.com/tools"
      on:click={closeMenu}
      target="_blank"
      class="flex ml-auto w-fit items-center justify-end"
    >
      <div class="text-blue-900 font-semibold text-xs flex items-center gap-1">
        {$t('profileMenu.see_more')}
        <ChevronDown class="text-blue-900" />
      </div>
    </a>
  </div>
  {#if !$globalStore.isOrgSite}
    <div class="border-b py-3 space-y-4">
      <a
        href="https://classroomio.com/roadmap"
        target="_blank"
        on:click={closeMenu}
        class="hover:no-underline flex items-center gap-2"
      >
        <NewTab />
        <p class="text-sm font-semibold">{$t('profileMenu.whats_new')}</p>
      </a>
      <a
        href="https://classroomio.com/blog/launch-week"
        target="_blank"
        on:click={closeMenu}
        class="hover:no-underline flex items-center gap-2"
      >
        <Rocket />
        <p class="text-sm font-semibold">{$t('profileMenu.launch_week')}</p>
      </a>
    </div>
  {/if}

  <button on:click={logout} class="w-full pt-3 space-y-4">
    <span class="flex items-center gap-2">
      <Logout />
      <p class="text-sm font-semibold">{$t('settings.profile.logout')}</p>
    </span>
  </button>
</div>
