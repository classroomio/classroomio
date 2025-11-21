<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import UsersIcon from '@lucide/svelte/icons/users';
  import Settings2Icon from '@lucide/svelte/icons/settings-2';
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';
  import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
  import MessageSquareMoreIcon from '@lucide/svelte/icons/message-square-more';

  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { isQuizPage } from '$lib/utils/functions/app';
  import { t } from '$lib/utils/functions/translations';
  import { orgs, isOrgAdmin } from '$lib/utils/store/org';

  import Box from '$lib/components/Box/index.svelte';
  import OrgSideBar from '$lib/components/Sidebar/index.svelte';
  import AddOrgModal from '$lib/components/Org/AddOrgModal/AddOrgModal.svelte';
  import VerifyEmailModal from '$lib/components/Org/VerifyEmail/VerifyEmailModal.svelte';

  let { data, children } = $props();

  function redirect(siteName: string) {
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

<div class="org-root flex w-full items-center justify-between">
  <div class="org-slot flex w-full items-start bg-white dark:bg-black">
    {#if !isQuizPage(page.url?.pathname)}
      {#if isSidebarReady}
        <OrgSideBar data={sidebarData} />
      {:else}
        <div class="bg-sidebar flex h-[calc(100vh-48px)] w-64 flex-col gap-2 border-r p-2">
          <!-- org switcher -->
          <div class="flex items-center gap-2 rounded-md p-2">
            <Skeleton class="h-8 w-8 rounded-lg" />
            <div class="flex flex-1 flex-col gap-1">
              <Skeleton class="h-4 w-24" />
              <Skeleton class="h-3 w-16" />
            </div>
            <Skeleton class="h-4 w-4" />
          </div>

          <!-- nav main -->
          <div class="flex flex-col gap-1 py-2">
            <Skeleton class="mb-2 h-3 w-16 px-2" />
            {#each Array(5) as _, i (i)}
              <div class="flex items-center gap-2 rounded-md p-2">
                <Skeleton class="h-4 w-4" />
                <Skeleton class="h-4 w-full" />
              </div>
            {/each}
          </div>

          <!-- spacer -->
          <div class="flex-1"></div>

          <!-- upgrade banner -->
          <div class="mx-4 mb-2 flex flex-col items-center gap-3 rounded-md border p-4">
            <Skeleton class="h-16 w-16 rounded-md" />
            <div class="flex flex-col items-center gap-2">
              <Skeleton class="h-4 w-32" />
              <Skeleton class="h-3 w-40" />
            </div>
            <Skeleton class="h-9 w-24 rounded-md" />
          </div>

          <!-- nav user -->
          <div class="flex items-center gap-2 rounded-md p-2">
            <Skeleton class="h-8 w-8 rounded-lg" />
            <div class="flex flex-1 flex-col gap-1">
              <Skeleton class="h-4 w-24" />
              <Skeleton class="h-3 w-20" />
            </div>
            <Skeleton class="h-4 w-4" />
          </div>
        </div>
      {/if}
    {:else}
      <div class="flex-1">
        {#if data.orgName === '*'}
          <Box>Taking you to your organization...</Box>
        {:else}
          {@render children?.()}
        {/if}
      </div>
    {/if}

    {#if !isQuizPage(page.url?.pathname)}
      <div class="flex-1">
        {#if data.orgName === '*'}
          <Box>Taking you to your organization...</Box>
        {:else}
          {@render children?.()}
        {/if}
      </div>
    {/if}
  </div>
</div>
