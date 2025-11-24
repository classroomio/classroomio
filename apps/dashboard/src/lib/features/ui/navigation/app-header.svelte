<script lang="ts">
  import { Separator } from '@cio/ui/base/separator';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import BellIcon from '@lucide/svelte/icons/bell';
  import { Button } from '@cio/ui/base/button';
  import * as Popover from '@cio/ui/base/popover';
  import Search from '../search.svelte';
  import AppBreadcrumbs from './app-breadcrumbs.svelte';
</script>

<header
  class="group-has-data-[collapsible=icon]/sidebar-wrapper:h-8 border-border flex h-12 w-full shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear"
>
  <div class="flex w-full items-center gap-2 px-4">
    <Sidebar.Trigger />

    <div class="h-4 w-2">
      <Separator orientation="vertical" />
    </div>

    <AppBreadcrumbs />

    <span class="grow"></span>

    <Search />

    <Popover.Root>
      <Popover.Trigger>
        <Button variant="outline" size="icon">
          <BellIcon class="custom rounded-full" />
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm">Your notifications will show here</p>
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  </div>
</header>
