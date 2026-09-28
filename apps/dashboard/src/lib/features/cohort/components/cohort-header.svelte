<script lang="ts">
  import { Separator } from '@cio/ui/base/separator';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { cohortApi } from '../api';
</script>

<header
  style="top: var(--sidebar-top-offset, 0px);"
  class="ui:border-border ui:bg-background ui:z-app-bar sticky flex h-12 w-full shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height,top] duration-200 ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-8"
>
  <div class="flex w-full items-center gap-2 px-4">
    <Sidebar.Trigger />

    <div class="h-4 w-2">
      <Separator orientation="vertical" />
    </div>

    <div class="flex min-w-0 items-center gap-2">
      <p class="max-w-2xs truncate text-sm font-medium">
        {cohortApi.cohort?.name || ''}
      </p>
    </div>

    <span class="grow"></span>
  </div>
</header>
