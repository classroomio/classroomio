<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { profile } from '$lib/utils/store/user';
  import { orgs } from '$lib/utils/store/org';
  import { globalStore } from '$lib/utils/store/app';

  import AppLogo from '../org-sidebar/app-logo.svelte';
  import Navigation from '$lib/components/Course/components/Navigation/index.svelte';
  import { SidebarFooterMenu } from '../footer';
  import UpgradeTrigger from '../org-sidebar/upgrade-trigger.svelte';
  import SidebarSkeleton from '../sidebar-skeleton.svelte';

  const isOrgLoaded = $derived($orgs.length > 0 && $profile.id);

  interface Props {
    path: string;
  }

  let { path }: Props = $props();
</script>

{#if !isOrgLoaded}
  <SidebarSkeleton />
{:else}
  <Sidebar.Root collapsible="icon">
    <Sidebar.Header>
      <AppLogo />
    </Sidebar.Header>

    <Sidebar.Content>
      <Navigation {path} isStudent={$globalStore.isStudent} />
    </Sidebar.Content>

    <Sidebar.Footer class="gap-4!">
      <UpgradeTrigger />
      <SidebarFooterMenu />
    </Sidebar.Footer>

    <Sidebar.Rail />
  </Sidebar.Root>
{/if}
