<script lang="ts">
  import { onMount } from 'svelte';
  import { Separator } from '@cio/ui/base/separator';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import BellIcon from '@lucide/svelte/icons/bell';
  import { Button } from '@cio/ui/base/button';
  import * as Popover from '@cio/ui/base/popover';
  import Search from '$features/ui/search.svelte';
  import AppBreadcrumbs from './app-breadcrumbs.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { setupProgressApi } from '$features/setup/api/setup-progress.svelte';
  import { pendingInvitesApi } from '$features/invite/api/pending-invites.svelte';
  import NotificationsContent from '$features/invite/components/notifications-content.svelte';
  import AppSetup from './app-setup.svelte';
  import VisitOrgSiteBtn from '$features/ui/visit-org-site-btn.svelte';

  const siteName = $derived($currentOrg.siteName);
  const notificationCount = $derived(pendingInvitesApi.count);

  $effect(() => {
    if (!siteName) return;

    setupProgressApi.fetchSetupProgress(siteName);
  });

  onMount(() => {
    pendingInvitesApi.fetchOnce();
  });
</script>

<header
  class="border-border ui:bg-background sticky top-0 z-50 flex h-12 w-full shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-8"
>
  <div class="flex w-full items-center gap-2 px-4">
    <Sidebar.Trigger />

    <div class="h-4 w-2">
      <Separator orientation="vertical" />
    </div>

    <AppBreadcrumbs />

    <span class="grow"></span>

    <AppSetup />
    <VisitOrgSiteBtn variant="outline" labelKey="dashboard.open_academy" />

    <Search />

    <Popover.Root>
      <Popover.Trigger>
        <div class="relative">
          <Button variant="secondary" size="icon">
            <BellIcon class="custom rounded-full" />
          </Button>
          {#if notificationCount > 0}
            <span
              class="ui:bg-primary ui:text-primary-foreground absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium"
            >
              {notificationCount}
            </span>
          {/if}
        </div>
      </Popover.Trigger>
      <Popover.Content>
        <NotificationsContent />
      </Popover.Content>
    </Popover.Root>
  </div>
</header>
