<script lang="ts">
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import type { AccountOrg } from '$features/app/types';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { orgApi } from '$features/org/api/org.svelte';
  import { landingPageSettings } from '$features/settings/utils/store';
  import { buildOrgLandingPageProps, normalizeLandingPageSettings } from '$features/org/utils/landing-page';
  import { landingPageThemeComponents } from '$features/org/utils/landing-page-components';
  import LandingpageEditor from '$features/settings/pages/landingpage-editor.svelte';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { basePath } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';

  let sidebarOpen = $state(true);
  let hasInitialized = $state(false);

  function isLandingPageTheme(value: string | null): value is 'minimal' | 'bold' | 'classic' {
    return value === 'minimal' || value === 'bold' || value === 'classic';
  }

  const savedLandingPageSettings = $derived(normalizeLandingPageSettings($currentOrg.landingpage));
  const previewTheme = $derived.by(() => {
    const queryTheme = page.url.searchParams.get('theme');
    if (isLandingPageTheme(queryTheme)) {
      return queryTheme;
    }

    return savedLandingPageSettings.theme;
  });
  const previewLandingPageSettings = $derived({
    ...$landingPageSettings,
    theme: previewTheme
  });

  const authAction = $derived(
    $user.isLoggedIn
      ? {
          label: t.get($basePath === '/lms' || $basePath === '#' ? 'navigation.goto_lms' : 'navigation.goto_dashboard'),
          href: resolve($basePath !== '#' ? $basePath : '/lms', {})
        }
      : {
          label: t.get('navigation.login'),
          href: '/login'
        }
  );

  const previewProps = $derived(
    buildOrgLandingPageProps(
      $currentOrg,
      previewLandingPageSettings,
      orgApi.publicCourses,
      orgApi.hasMorePublicCourses,
      authAction
    )
  );

  const ThemeComponent = $derived(landingPageThemeComponents[previewTheme] ?? landingPageThemeComponents.minimal);

  onMount(() => {
    if ($currentOrg.siteName) {
      orgApi.publicCourses = [];
      orgApi.hasMorePublicCourses = false;
      void orgApi.getPublicCoursesBySiteName($currentOrg.siteName);
    }
  });

  $effect(() => {
    if (hasInitialized || !$currentOrg.id) {
      return;
    }

    $landingPageSettings = normalizeLandingPageSettings($currentOrg.landingpage);
    hasInitialized = true;
  });

  function handleClose() {
    const queryTheme = page.url.searchParams.get('theme');
    const querySuffix = isLandingPageTheme(queryTheme) ? `?theme=${encodeURIComponent(queryTheme)}` : '';
    goto(resolve(`${$currentOrgPath}/settings/landingpage${querySuffix}`, {}));
  }
</script>

<svelte:head>
  <title>Landing Page Editor - ClassroomIO</title>
</svelte:head>

<div
  class="bg-background fixed inset-0 z-250 h-screen w-screen"
  in:fly={{ y: 500, duration: 500 }}
  out:fly={{ y: 500, duration: 500 }}
>
  <Sidebar.Provider bind:open={sidebarOpen} style="--sidebar-width: 280px">
    <Sidebar.Root side="left" collapsible="icon" class="h-full">
      <LandingpageEditor
        bind:settings={$landingPageSettings}
        onSave={async () => {
          const updatedLandingPage = normalizeLandingPageSettings({
            ...$landingPageSettings,
            theme: page.url.searchParams.get('theme') ? savedLandingPageSettings.theme : $landingPageSettings.theme
          });

          await orgApi.update($currentOrg.id, {
            landingpage: updatedLandingPage as AccountOrg['landingpage']
          });
        }}
        onClose={handleClose}
      />
    </Sidebar.Root>

    <Sidebar.Inset
      class="relative h-screen! w-[calc(100vw-var(--sidebar-width))] overflow-y-auto group-data-[collapsible=icon]:w-[calc(100vw-var(--sidebar-width-icon))]"
    >
      <div class="absolute top-2 left-2 z-60">
        <Sidebar.Trigger variant="secondary" />
      </div>

      <ThemeComponent {...previewProps} disableCourseLinks={true} />
    </Sidebar.Inset>
  </Sidebar.Provider>
</div>
