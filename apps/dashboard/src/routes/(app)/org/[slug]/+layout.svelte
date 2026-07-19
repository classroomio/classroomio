<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { currentOrg } from '$lib/utils/store/org';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { appInitApi } from '$features/app/init.svelte';
  import { AppHeader } from '$features/ui';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';

  import { OrgSidebar } from '$features/ui/sidebar/org-sidebar';
  import { AddOrgModal } from '$features/org';

  let { data, children } = $props();

  const isNotesWorkspace = $derived(/\/notes(?:\/|$)/.test(page.url.pathname));

  function redirect(siteName: string | null) {
    if (!siteName) return;

    const newUrl = page.url.pathname.replace('*', siteName);
    goto(newUrl + page.url.search);
  }

  $effect(() => {
    data.orgName === '*' && redirect($currentOrg.siteName);
  });

  $effect(() => {
    // Students must not use the admin org dashboard on app.* — send them to LMS.
    // isStudentExperience is false on the app host in cloud mode even for students.
    if (appInitApi.isInitializedAndReady && $isOrgStudent) {
      goto(resolve('/lms', {}));
    }
  });
</script>

{#if PUBLIC_IS_SELFHOSTED !== 'true'}
  <AddOrgModal />
{/if}

<Sidebar.Provider class={isNotesWorkspace ? 'h-svh max-h-svh' : undefined}>
  <OrgSidebar />

  <Sidebar.Inset class={isNotesWorkspace ? 'h-svh max-h-svh min-h-0 flex-1 overflow-hidden p-0' : 'min-h-0 flex-1 overflow-hidden p-0'}>
    <AppHeader />

    {#if isNotesWorkspace}
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        {#if data.orgName === '*'}
          <div class="grid auto-rows-min gap-4 px-4 md:grid-cols-3">
            <Skeleton class="aspect-video rounded-xl" />
            <Skeleton class="aspect-video rounded-xl" />
            <Skeleton class="aspect-video rounded-xl" />
          </div>
          <Skeleton class="mx-4 h-[50vh] rounded-xl" />
        {:else}
          {@render children?.()}
        {/if}
      </div>
    {:else}
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
    {/if}
  </Sidebar.Inset>
</Sidebar.Provider>
