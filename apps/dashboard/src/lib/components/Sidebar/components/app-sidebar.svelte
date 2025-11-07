<script lang="ts">
  import { goto } from '$app/navigation';
  import * as Sidebar from '@cio/ui/base/sidebar';

  import { isFreePlan } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import type { AppSidebar } from '$lib/utils/types/sidebar';

  import NavMain from './nav-main.svelte';
  import NavUser from './nav-user.svelte';
  import NavProjects from './nav-projects.svelte';
  import TeamSwitcher from './team-switcher.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  let {
    sidebarData,
    canAddOrg = true,
    ref = $bindable(null),
    collapsible = 'icon',
    ...restProps
  }: AppSidebar = $props();

  const openModal = () => {
    goto(window.location.pathname + '?upgrade=true');
  };
</script>

<Sidebar.Root {collapsible} {...restProps} class="inset-y-12 h-[calc(100vh-48px)]">
  {#if sidebarData.teams}
    <Sidebar.Header>
      <TeamSwitcher {canAddOrg} teams={sidebarData.teams} />
    </Sidebar.Header>
  {/if}

  <Sidebar.Content>
    <NavMain items={sidebarData.navMain} />

    {#if sidebarData?.projects?.length > 0}
      <NavProjects projects={sidebarData.projects} />
    {/if}
  </Sidebar.Content>

  {#if $isFreePlan}
    <Sidebar.Content>
      <div
        class="border-primary-700 mx-4 mt-2 flex flex-col items-center justify-center gap-4 rounded-md border px-2 py-6 text-center transition-all ease-in-out hover:scale-95"
      >
        <img src="/upgrade.png" alt="upgrade" class="h-16 w-16" />
        <span class="flex flex-col gap-1">
          <p class="text-base font-semibold">{$t('org_navigation.early_adopter')}</p>
          <p class="text-xs">{$t('org_navigation.unlock')}</p>
        </span>
        <PrimaryButton label={$t('org_navigation.upgrade')} onClick={openModal} className="font-normal" />
      </div>
    </Sidebar.Content>
  {/if}

  {#if sidebarData.user}
    <Sidebar.Footer>
      <NavUser user={sidebarData.user} />
    </Sidebar.Footer>
  {/if}

  <Sidebar.Rail />
</Sidebar.Root>
