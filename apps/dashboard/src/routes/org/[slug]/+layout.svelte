<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { currentOrg } from '$lib/utils/store/org';
  import { AppHeader } from '$lib/features/ui';

  import { VerifyEmailModal } from '$lib/features/onboarding/components';

  import { OrgSidebar } from '$lib/features/ui/sidebar/org-sidebar/index.js';
  import AddOrgModal from '$lib/components/Org/AddOrgModal/AddOrgModal.svelte';

  let { data, children } = $props();

  function redirect(siteName: string) {
    if (!siteName) return;

    const newUrl = page.url.pathname.replace('*', siteName);
    goto(newUrl + page.url.search);
  }

  function isActive(pagePath: string, itemPath: string) {
    const pageLinkItems = pagePath.split('/');
    const itemLinkItems = itemPath.split('/');

    if (itemLinkItems.length !== pageLinkItems.length) {
      return false;
    }

    return pagePath.includes(itemPath);
  }

  const sidebarData = $derived({
    teams: $orgs,
    navMain: [
      {
        title: $t('org_navigation.dashboard'),
        url: '/',
        icon: LayoutDashboardIcon,
        isActive: isActive(page.url.pathname, `/org/${data.orgName}`)
      },
      {
        title: $t('org_navigation.courses'),
        url: `/courses`,
        icon: LibraryBigIcon,
        isActive: isActive(page.url.pathname, `/org/${data.orgName}/courses`)
      },
      {
        title: $t('org_navigation.community'),
        url: `/community`,
        icon: MessageSquareMoreIcon,
        isActive: isActive(page.url.pathname, `/org/${data.orgName}/community`)
      },
      {
        title: $t('org_navigation.audience'),
        url: `/audience`,
        icon: UsersIcon,
        isActive: isActive(page.url.pathname, `/org/${data.orgName}/audience`)
      },
      ...(!!$isOrgAdmin
        ? [
            {
              title: $t('org_navigation.setup'),
              url: `/setup`,
              icon: Settings2Icon,
              isActive: isActive(page.url.pathname, `/org/${data.orgName}/setup`)
            }
          ]
        : [])
    ],
    user: {
      name: $profile.fullname,
      email: $profile.email,
      avatar: $profile.avatar_url
    }
  });

  const isSidebarReady = $derived($orgs.length > 0 && $profile.fullname && $profile.email);

  $effect(() => {
    data.orgName === '*' && redirect($currentOrg.siteName);
  });
</script>

<AddOrgModal />

<VerifyEmailModal />

<Sidebar.Provider>
  <OrgSidebar />

  <Sidebar.Inset>
    <AppHeader />

    <div class="container mx-auto flex max-w-6xl flex-1 flex-col gap-4 p-4 pt-0">
      {#if data.orgName === '*'}
        <div class="grid auto-rows-min gap-4 md:grid-cols-3">
          <Skeleton class="aspect-video rounded-xl" />
          <Skeleton class="aspect-video rounded-xl" />
          <Skeleton class="aspect-video rounded-xl" />
        </div>
        <Skeleton class="h-[50vh] w-full rounded-xl" />
      {:else}
        {@render children?.()}
      {/if}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
