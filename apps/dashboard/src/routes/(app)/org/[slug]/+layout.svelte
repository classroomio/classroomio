<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { currentOrg } from '$lib/utils/store/org';
  import { isOrgStudent } from '$lib/utils/store/app';
  import { appInitApi } from '$features/app/init.svelte';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
  import { AddOrgModal } from '$features/org';
  import { appConfig } from '$lib/utils/config';
  import { SHELL_REGISTRY, SidebarShell } from '$features/ui/shells';

  let { data, children } = $props();
  const isSettingsRoute = $derived(/\/settings(?:\/|$)/.test(page.url.pathname));

  // If the config passes a raw component (e.g. from a third-party plugin), use it
  // directly. Otherwise look it up in the registry by key, falling back to Sidebar.
  const ShellComponent = $derived(
    typeof appConfig.layout.shell === 'function' ||
      (typeof appConfig.layout.shell === 'object' && appConfig.layout.shell !== null)
      ? appConfig.layout.shell
      : (SHELL_REGISTRY[appConfig.layout.key] ?? SidebarShell)
  );

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

<ShellComponent {isSettingsRoute} {data}>
  {@render children?.()}
</ShellComponent>
