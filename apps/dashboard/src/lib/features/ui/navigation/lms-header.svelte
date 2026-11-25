<script lang="ts">
  import { Separator } from '@cio/ui/base/separator';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import BellIcon from '@lucide/svelte/icons/bell';
  import { Button } from '@cio/ui/base/button';
  import * as Popover from '@cio/ui/base/popover';
  import Search from '../search.svelte';
  import LmsBreadcrumbs from './lms-breadcrumbs.svelte';
  import VisitOrgSiteBtn from '../visit-org-site-btn.svelte';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import { onMount } from 'svelte';
  import { notificationsApi } from '$features/notifications/api/notifications.svelte';
  import NotificationsPanel from '$features/notifications/components/notifications-panel.svelte';

  interface Props {
    hideSearch?: boolean;
  }

  let { hideSearch = false }: Props = $props();

  const notificationCount = $derived(notificationsApi.unreadCount);

  onMount(() => {
    notificationsApi.fetchOnce();
  });
</script>

<header
  class="ui:border-border ui:bg-background sticky top-0 z-50 flex h-12 w-full shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-8"
>
  <div class="flex w-full items-center gap-2 px-4">
    <Sidebar.Trigger />

    <div class="h-4 w-2">
      <Separator orientation="vertical" />
    </div>

    <LmsBreadcrumbs />

    <span class="grow"></span>

    {#if !hideSearch}
      <VisitOrgSiteBtn variant="outline" labelKey="lms.view_landing_page" pathname="/" icon={ExternalLinkIcon} />

      <Search scope="lms" />

      <div class="relative">
        <Popover.Root>
          <Popover.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant="secondary" size="icon" testId="lms-notifications-trigger">
                <BellIcon class="custom rounded-full" />
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content align="end" sideOffset={8} class="ui:p-0! w-[460px]">
            <NotificationsPanel />
          </Popover.Content>
        </Popover.Root>

        {#if notificationCount > 0}
          <span
            class="ui:bg-primary ui:text-primary-foreground pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium"
          >
            {notificationCount}
          </span>
        {/if}
      </div>
    {/if}
  </div>
</header>
