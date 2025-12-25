<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { currentOrg } from '$lib/utils/store/org';
  import { AppHeader } from '$features/ui';

  import { VerifyEmailModal } from '$features/onboarding/components';

  import { OrgSidebar } from '$features/ui/sidebar/org-sidebar';
  import { AddOrgModal } from '$features/org';

  let { data, children } = $props();

  function redirect(siteName: string) {
    if (!siteName) return;

    const newUrl = page.url.pathname.replace('*', siteName);
    goto(newUrl + page.url.search);
  }

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
