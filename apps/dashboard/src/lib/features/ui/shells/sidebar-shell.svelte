<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { AppHeader } from '$features/ui';
  import { OrgSidebar } from '$features/ui/sidebar/org-sidebar';
  import SettingsSidebar from '$features/ui/sidebar/settings-sidebar.svelte';

  interface Props {
    isSettingsRoute?: boolean;
    data?: {
      orgName?: string;
      [key: string]: any;
    };
    children?: Snippet;
  }

  let { isSettingsRoute = false, data = {}, children }: Props = $props();
</script>

<div data-testid="layout-sidebar" class="flex min-h-screen w-full">
  <Sidebar.Provider>
    {#if isSettingsRoute}
      <SettingsSidebar />
    {:else}
      <OrgSidebar />
    {/if}

    <Sidebar.Inset>
      {#if isSettingsRoute}
        <div class="flex h-10 items-center px-3 md:hidden">
          <Sidebar.Trigger testId="settings-sidebar-trigger-mobile" />
        </div>
      {:else}
        <AppHeader />
      {/if}

      <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4">
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
</div>
