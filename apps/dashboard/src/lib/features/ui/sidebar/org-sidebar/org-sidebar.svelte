<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { profile } from '$lib/utils/store/user';
  import { orgs } from '$lib/utils/store/org';

  import AppLogo from './app-logo.svelte';
  import NavMain from './nav-main.svelte';
  import { SidebarFooterMenu } from '../footer';
  import UpgradeTrigger from './upgrade-trigger.svelte';
  import SidebarSkeleton from '../sidebar-skeleton.svelte';

  const isOrgLoaded = $derived($orgs.length > 0 && $profile.id);
</script>

{#if !isOrgLoaded}
  <SidebarSkeleton />
{:else}
  <Sidebar.Root collapsible="icon">
    <Sidebar.Header>
      <AppLogo />
    </Sidebar.Header>

    <Sidebar.Content>
      <NavMain />
      <UpgradeTrigger />
    </Sidebar.Content>

    <Sidebar.Footer>
      <SidebarFooterMenu />
    </Sidebar.Footer>

    <Sidebar.Rail />
  </Sidebar.Root>
{/if}
