<script>
  import { VARIANTS } from '../../PrimaryButton/constants';
  import { globalStore } from '$lib/utils/store/app';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { currentOrgDomain, currentOrgPath } from '$lib/utils/store/org';

  import { ChevronDown, Settings } from 'carbon-icons-svelte';
  import Logout from 'carbon-icons-svelte/lib/Logout.svelte';
  import Rocket from 'carbon-icons-svelte/lib/Rocket.svelte';
  import NewTab from 'carbon-icons-svelte/lib/NewTab.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { goto } from '$app/navigation';

  const handleNavigate = (url) => {
    goto(url);
  };
</script>

<div class="md:px-4 md:py-4 py-2 px-2 rounded-md cursor-pointer">
  <div class="border-b py-3 space-y-4">
    <p class="text-xs font-semibold text-gray-500">PROFILE</p>
    <a href={`${$currentOrgPath}/settings`} class="flex items-center justify-between gap-8">
      <span class="flex items-center gap-2">
        <img src={$profile.avatar_url} alt="profile" class="h-8 w-8 rounded-full" />
        <div>
          <p class="text-sm font-semibold">{$profile.fullname}</p>
          <p class="text-xs">{$profile.email}</p>
        </div>
      </span>
      <Settings size={20} />
    </a>
  </div>
  {#if !$globalStore.isOrgSite}
    <div class="border-b py-3 space-y-4">
      <p class="text-xs font-semibold text-gray-500">CURRENT ORGANIZATION</p>
      <a
        href={`${$currentOrgPath}/settings?tab=org`}
        class="flex items-center justify-between gap-8"
      >
        <span class="flex items-center gap-2">
          <div
            class="flex items-center justify-center h-8 w-8 bg-blue-900 text-white font-semibold rounded-lg"
          >
            {$currentOrg.shortName}
          </div>
          <div>
            <p class="text-sm font-semibold">{$currentOrg.name}</p>
            <p class="text-xs">{`${$currentOrg.siteName || ''}.classroomio.com/`}</p>
          </div>
        </span>
        <Settings size={20} />
      </a>
    </div>
  {/if}

  <div class="border-b py-3 space-y-4">
    <p class="text-xs font-semibold text-gray-500">FREE TOOLS</p>
    <span class="flex items-center gap-2">
      <img src="/progress.svg" alt="" class="h-6 w-6 rounded-full" />
      <p class="text-sm font-semibold">Progress report</p>
    </span>
    <span class="flex items-center gap-2">
      <img src="/timer.svg" alt="" class="h-6 w-6 rounded-full" />
      <p class="text-sm font-semibold">Activity timer</p>
    </span>
    <span class="flex items-center gap-2">
      <img src="/tictac.svg" alt="" class="h-6 w-6 rounded-full" />
      <p class="text-sm font-semibold">Tictac toe</p>
    </span>
    <div class="flex items-center justify-end">
      <PrimaryButton variant={VARIANTS.TEXT} className="text-blue-900 font-semibold text-xs ">
        See more
        <ChevronDown class="text-blue-900" />
      </PrimaryButton>
    </div>
  </div>
  {#if !$globalStore.isOrgSite}
    <div class="border-b py-3 space-y-4">
      <span class="flex items-center gap-2">
        <NewTab />
        <p class="text-sm font-semibold">Whats new?</p>
      </span>

      <span class="flex items-center gap-2">
        <Rocket />
        <p class="text-sm font-semibold">Launch week</p>
      </span>
    </div>
  {/if}

  <div class="border-b py-3 space-y-4">
    <span class="flex items-center gap-2">
      <Logout />
      <p class="text-sm font-semibold">Logout</p>
    </span>
  </div>
</div>
