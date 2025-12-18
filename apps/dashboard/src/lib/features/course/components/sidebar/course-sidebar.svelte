<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { profile } from '$lib/utils/store/user';
  import { orgs } from '$lib/utils/store/org';
  import { globalStore } from '$lib/utils/store/app';

  import OrgLogo from '$features/ui/sidebar/org-sidebar/org-logo.svelte';
  import Navigation from './course-sidebar-navigation.svelte';
  import SidebarSkeleton from '$features/ui/sidebar/sidebar-skeleton.svelte';

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
      <OrgLogo />
    </Sidebar.Header>

    <Sidebar.Content>
      <Navigation {path} isStudent={$globalStore.isStudent} />
    </Sidebar.Content>

    <Sidebar.Rail />
  </Sidebar.Root>
{/if}
