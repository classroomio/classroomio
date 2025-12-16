<script lang="ts">
  import { Separator } from '@cio/ui/base/separator';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import BellIcon from '@lucide/svelte/icons/bell';
  import { Button } from '@cio/ui/base/button';
  import * as Popover from '@cio/ui/base/popover';
  import Search from '../search.svelte';
  import AppBreadcrumbs from './app-breadcrumbs.svelte';
  import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw';
  import * as Empty from '@cio/ui/base/empty';
  import { currentOrg } from '$lib/utils/store/org';
  import { setupProgressApi } from '$features/setup/api/setup-progress.svelte';
  import AppSetup from './app-setup.svelte';

  const siteName = $derived($currentOrg.siteName);

  $effect(() => {
    if (!siteName) return;

    setupProgressApi.fetchSetupProgress(siteName);
  });

  interface Props {
    hideSearch?: boolean;
  }

  let { hideSearch = false }: Props = $props();
</script>

<header
  class="group-has-data-[collapsible=icon]/sidebar-wrapper:h-8 border-border ui:bg-background bg-background sticky top-0 z-50 flex h-12 w-full shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear"
>
  <div class="flex w-full items-center gap-2 px-4">
    <Sidebar.Trigger />

    <div class="h-4 w-2">
      <Separator orientation="vertical" />
    </div>

    <AppBreadcrumbs />

    <span class="grow"></span>

    {#if !hideSearch}
      <AppSetup />
      <Search />

      <Popover.Root>
        <Popover.Trigger>
          <Button variant="outline" size="icon">
            <BellIcon class="custom rounded-full" />
          </Button>
        </Popover.Trigger>
        <Popover.Content>
          <Empty.Root class="ui:from-muted/50 ui:to-background ui:h-full ui:bg-gradient-to-b ui:from-30%">
            <Empty.Header>
              <Empty.Media variant="icon">
                <BellIcon />
              </Empty.Media>
              <Empty.Title>No Notifications</Empty.Title>
              <Empty.Description>You're all caught up. New notifications will appear here.</Empty.Description>
            </Empty.Header>
            <Empty.Content>
              <Button variant="outline" size="sm">
                <RefreshCcwIcon />
                Refresh
              </Button>
            </Empty.Content>
          </Empty.Root>
        </Popover.Content>
      </Popover.Root>
    {/if}
  </div>
</header>
