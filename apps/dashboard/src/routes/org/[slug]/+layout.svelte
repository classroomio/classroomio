<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import FrameIcon from '@lucide/svelte/icons/frame';
  import UsersIcon from '@lucide/svelte/icons/users';
  import ChartPieIcon from '@lucide/svelte/icons/chart-pie';
  import Settings2Icon from '@lucide/svelte/icons/settings-2';
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';
  import AudioWaveformIcon from '@lucide/svelte/icons/audio-waveform';
  import SquareTerminalIcon from '@lucide/svelte/icons/square-terminal';
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
    teams: [
      ...$orgs.map((org) => ({
        name: org.name,
        logo: AudioWaveformIcon,
        plan: org.organization_plan?.[0]?.plan_name || 'Free'
      })),
      {
        name: 'Add Team',
        logo: FrameIcon,
        plan: 'Free'
      }
    ],
    navMain: [
      {
        title: $t('org_navigation.dashboard'),
        url: '',
        icon: LayoutDashboardIcon,
        isActive: isActive(page.url.pathname, ``)
      },
      {
        title: $t('org_navigation.courses'),
        url: `/courses`,
        icon: LibraryBigIcon,
        isActive: page.url.pathname.includes(`/courses`)
      },
      {
        title: $t('org_navigation.community'),
        url: `/community`,
        icon: MessageSquareMoreIcon,
        isActive: page.url.pathname.includes(`/community`)
      },
      {
        title: $t('org_navigation.audience'),
        url: `/audience`,
        icon: UsersIcon,
        isActive: page.url.pathname.includes(`/audience`)
      },
      ...(!!$isOrgAdmin
        ? [
            {
              title: $t('org_navigation.setup'),
              url: `/setup`,
              icon: Settings2Icon,
              isActive: page.url.pathname.includes(`/setup`)
            }
          ]
        : [])
    ],
    projects: [
      {
        name: $t('profileMenu.progress'),
        url: 'https://classroomio.com/tools/progress',
        icon: ChartPieIcon
      },
      {
        name: $t('profileMenu.timer'),
        url: 'https://classroomio.com/tools/activity-stopwatch',
        icon: SquareTerminalIcon
      },
      {
        name: $t('profileMenu.tic_tac'),
        url: 'https://classroomio.com/tools/tic-tac-toe',
        icon: FrameIcon
      }
    ],
    user: {
      name: $profile.fullname,
      email: $profile.email,
      avatar: $profile.avatar_url
    }
  });

  $effect(() => {
    data.orgName === '*' && redirect($currentOrg.siteName);
  });
</script>

<AddOrgModal />

<VerifyEmailModal />

<div class="org-root flex w-full items-center justify-between">
  <div class="org-slot flex w-full items-start bg-white dark:bg-black">
    {#if !isQuizPage(page.url?.pathname)}
      <OrgSideBar data={sidebarData} />
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
