<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { profile } from '$lib/utils/store/user';
  import { orgs } from '$lib/utils/store/org';

  import NavMain from './nav-main.svelte';
  import OrgLogo from '../org-sidebar/org-logo.svelte';
  import { SidebarFooterMenu } from '../footer';
  import SidebarSkeleton from '../sidebar-skeleton.svelte';

  const isOrgLoaded = $derived($orgs.length > 0 && $profile.id);
</script>

{#if !isOrgLoaded}
  <SidebarSkeleton />
{:else}
  <Sidebar.Root collapsible="icon">
    <Sidebar.Header>
      <OrgLogo />
    </Sidebar.Header>

    <Sidebar.Content>
      <NavMain />
    </Sidebar.Content>

    {#if $profile.id}
      <Sidebar.Footer class="gap-4!">
        <SidebarFooterMenu />
      </Sidebar.Footer>
    {/if}

    <Sidebar.Rail />
  </Sidebar.Root>
{/if}
