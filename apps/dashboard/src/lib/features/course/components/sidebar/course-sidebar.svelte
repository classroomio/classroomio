<script lang="ts">
  import { page } from '$app/state';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { profile } from '$lib/utils/store/user';
  import { orgs } from '$lib/utils/store/org';
  import { globalStore } from '$lib/utils/store/app';
  import { isFreePlan } from '$lib/utils/store/org';

  import OrgLogo from '$features/ui/sidebar/org-sidebar/org-logo.svelte';
  import Navigation from './course-sidebar-navigation.svelte';
  import CourseContentNavigation from './course-content-sidebar-navigation.svelte';
  import SidebarSkeleton from '$features/ui/sidebar/sidebar-skeleton.svelte';
  import UpgradePoweredBy from '$features/ui/upgrade-powered-by.svelte';
  import { useSidebar } from '@cio/ui/base/sidebar';
  import { isCourseContentRoute, isCourseRouteForId } from '$features/course/utils/sidebar-routes';
  import { rememberLastNonContentCourseRoute } from './sidebar-history';

  const isOrgLoaded = $derived($orgs.length > 0 && $profile.id);

  interface Props {
    path: string;
    id: string;
  }

  let { path, id }: Props = $props();

  const sidebar = useSidebar();
  const currentPath = $derived(path || page.url.pathname);
  const isContentOnlyMode = $derived(isCourseContentRoute(currentPath));

  $effect(() => {
    const pathname = page.url.pathname;
    if (!isCourseRouteForId(pathname, id) || isCourseContentRoute(pathname)) return;

    rememberLastNonContentCourseRoute(id, `${pathname}${page.url.search}`);
  });
</script>

{#if !isOrgLoaded}
  <SidebarSkeleton />
{:else}
  <Sidebar.Root collapsible="icon">
    <Sidebar.Header>
      <OrgLogo />
    </Sidebar.Header>

    <Sidebar.Content>
      {#if isContentOnlyMode}
        <CourseContentNavigation path={currentPath} {id} isStudent={$globalStore.isStudent} />
      {:else}
        <Navigation path={currentPath} {id} isStudent={$globalStore.isStudent} />
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
