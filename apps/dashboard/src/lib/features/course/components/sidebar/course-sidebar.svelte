<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { profile } from '$lib/utils/store/user';
  import { orgs } from '$lib/utils/store/org';
  import { globalStore } from '$lib/utils/store/app';
  import { isFreePlan } from '$lib/utils/store/org';

  import OrgLogo from '$features/ui/sidebar/org-sidebar/org-logo.svelte';
  import Navigation from './course-sidebar-navigation.svelte';
  import SidebarSkeleton from '$features/ui/sidebar/sidebar-skeleton.svelte';
  import UpgradePoweredBy from '$features/ui/upgrade-powered-by.svelte';
  import { useSidebar } from '@cio/ui/base/sidebar';

  const isOrgLoaded = $derived($orgs.length > 0 && $profile.id);

  interface Props {
    path: string;
  }

  let { path }: Props = $props();

  const sidebar = useSidebar();
</script>

{#if !isOrgLoaded}
  <SidebarSkeleton />
{:else}
  <Sidebar.Root collapsible="icon">
    <Sidebar.Header>
      <OrgLogo />
    </Sidebar.Header>

    <Sidebar.Content>
      <Navigation {path} isStudent={$globalStore.isStudent} />
    </Sidebar.Content>

    <Sidebar.Rail />

    {#if $isFreePlan}
      <Sidebar.Footer>
        <UpgradePoweredBy
          class="static [&_span]:font-normal [&_span]:shadow-none"
          showOnlyLogo={!sidebar.open || sidebar.isMobile}
        />
      </Sidebar.Footer>
    {/if}
  </Sidebar.Root>
{/if}
