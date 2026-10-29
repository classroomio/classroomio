<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg, orgs } from '$lib/utils/store/org';
  import { pluginsApi } from '$features/plugins';

  import NavMain from './nav-main.svelte';
  import OrgLogo from '../org-sidebar/org-logo.svelte';
  import { SidebarFooterMenu } from '../footer';
  import SidebarSkeleton from '../sidebar-skeleton.svelte';

  const isOrgLoaded = $derived($orgs.length > 0 && $profile.id);

  $effect(() => {
    if (!isOrgLoaded || !$currentOrg.id) return;
    void pluginsApi.listOrgInstallations($currentOrg.id);
  });
</script>

{#if !isOrgLoaded}
  <SidebarSkeleton />
{:else}
  <Sidebar.Root collapsible="icon" class="md:relative! md:inset-y-auto! md:h-full!">
    <Sidebar.Header>
      <OrgLogo />
    </Sidebar.Header>

    <Sidebar.Content>
      <NavMain />
    </Sidebar.Content>

    <Sidebar.Footer class="gap-4!">
      <SidebarFooterMenu />
    </Sidebar.Footer>

    <Sidebar.Rail />
  </Sidebar.Root>
{/if}
