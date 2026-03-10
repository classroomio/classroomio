<script lang="ts">
  import { page } from '$app/state';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Skeleton } from '@cio/ui/base/skeleton';
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

  /** When false, course is still loading and sidebar nav shows skeletons. */
  const SIDEBAR_ITEM_SKELETON_COUNT = 8;

  interface Props {
    path: string;
    id: string;
    /** If false, sidebar nav shows loading skeletons. Omit or true = show real nav. */
    isCourseReady?: boolean;
  }

  let { path, id, isCourseReady = true }: Props = $props();

  const sidebar = useSidebar();
  const currentPath = $derived(path || page.url.pathname);
</script>

{#if !isOrgLoaded}
  <SidebarSkeleton />
{:else}
  <Sidebar.Root collapsible="icon">
    <Sidebar.Header>
      <OrgLogo />
    </Sidebar.Header>

    <Sidebar.Content>
      {#if isCourseReady}
        <Navigation path={currentPath} {id} isStudent={$globalStore.isStudent} />
      {:else}
        <Sidebar.Group class="pt-0!">
          <div class="flex h-8 items-center gap-2 rounded-md px-2">
            <Skeleton class="ui:size-4 ui:rounded-md" />
            <Skeleton class="ui:h-4 ui:w-24" />
          </div>
          <Sidebar.Menu>
            {#each Array(SIDEBAR_ITEM_SKELETON_COUNT) as _, i (i)}
              <Sidebar.MenuItem>
                <div class="ui:flex ui:h-8 ui:items-center ui:gap-2 ui:rounded-md ui:px-2" data-sidebar="menu-skeleton">
                  <Skeleton class="ui:size-4 ui:rounded-md" />
                  <Skeleton class="ui:h-4 ui:max-w-32 ui:flex-1" />
                </div>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.Group>
      {/if}
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
