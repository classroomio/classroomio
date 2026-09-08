<script lang="ts">
  import { page } from '$app/state';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { profile } from '$lib/utils/store/user';
  import { orgs } from '$lib/utils/store/org';

  import OrgLogo from '$features/ui/sidebar/org-sidebar/org-logo.svelte';
  import Navigation from './cohort-sidebar-navigation.svelte';
  import SidebarSkeleton from '$features/ui/sidebar/sidebar-skeleton.svelte';
  import PoweredBy from '$features/ui/powered-by.svelte';
  import { useSidebar } from '@cio/ui/base/sidebar';

  const SIDEBAR_ITEM_SKELETON_COUNT = 4;

  interface Props {
    path: string;
    id: string;
    isCohortReady?: boolean;
  }

  let { path, id, isCohortReady = true }: Props = $props();

  const isOrgLoaded = $derived($orgs.length > 0 && $profile.id);
  const sidebar = useSidebar();
  const currentPath = $derived(path || page.url.pathname);
</script>

{#if !isOrgLoaded}
  <SidebarSkeleton />
{:else}
  <Sidebar.Root collapsible="icon" class="ui:z-app-bar-elevated">
    <Sidebar.Header>
      <OrgLogo />
    </Sidebar.Header>

    <Sidebar.Content>
      {#if isCohortReady}
        <Navigation path={currentPath} {id} />
      {:else}
        <Sidebar.Group class="pt-0!">
          <div class="flex h-8 items-center gap-2 rounded-md px-2">
            <Skeleton class="size-4 rounded-md" />
            <Skeleton class="h-4 w-24" />
          </div>
          <Sidebar.Menu>
            {#each Array(SIDEBAR_ITEM_SKELETON_COUNT) as _, i (i)}
              <Sidebar.MenuItem>
                <div class="flex h-8 items-center gap-2 rounded-md px-2" data-sidebar="menu-skeleton">
                  <Skeleton class="size-4 rounded-md" />
                  <Skeleton class="h-4 max-w-32 flex-1" />
                </div>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.Group>
      {/if}
    </Sidebar.Content>

    <Sidebar.Rail />

    <Sidebar.Footer>
      <PoweredBy
        variant="sidebar"
        sidebarUtmSource="lms-cohort-sidebar"
        showOnlyLogo={!sidebar.open || sidebar.isMobile}
      />
    </Sidebar.Footer>
  </Sidebar.Root>
{/if}
