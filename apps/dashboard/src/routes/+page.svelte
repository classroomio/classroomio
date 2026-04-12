<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import type { Component } from 'svelte';

  import { Spinner } from '@cio/ui/base/spinner';
  import { SimpleLogoNav } from '@cio/ui/custom/simple-logo-nav';
  import {
    buildOrgLandingPageProps,
    importThemeComponent,
    normalizeLandingPageSettings
  } from '$features/org/utils/landing-page';
  import { basePath } from '$lib/utils/store/app';
  import { globalStore } from '$lib/utils/store/app';
  import { currentOrg } from '$lib/utils/store/org';
  import { setTheme } from '$lib/utils/functions/theme';
  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';
  import PageLoader from '$features/org/components/landing-page/page-loader.svelte';

  let { data } = $props();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ThemeComponent = $state<Component<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let DashboardEntry = $state<Component<any> | null>(null);

  const pageTitle = $derived(
    data.isOrgSite && data.org ? data.org.name : "ClassroomIO - The Course Platform That's Actually Easy To Use"
  );

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

  const landingPageProps = $derived.by(() => {
    if (!data.isOrgSite || !data.org) return null;

    return buildOrgLandingPageProps(
      data.org,
      normalizeLandingPageSettings(data.org.landingpage),
      data.courses,
      data.hasMoreCourses,
      authAction
    );
  });

  onMount(async () => {
    const loadingIndicator = document.getElementById('app-loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }

    if (!data.isOrgSite || !data.org) {
      const mod = await import('./_dashboard-entry.svelte');
      DashboardEntry = mod.default;
      return;
    }

    if (data.locals?.user) {
      user.set({
        ...$user,
        isLoggedIn: true,
        currentSession: data.locals.user
      });
    }

    $globalStore.orgSiteName = data.orgSiteName || '';
    $globalStore.isOrgSite = true;
    currentOrg.set(data.org);
    setTheme(data.org.theme || 'blue');

    const settings = normalizeLandingPageSettings(data.org.landingpage);
    const mod = await importThemeComponent(settings.theme);
    ThemeComponent = mod.default;
  });
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

{#if data.isOrgSite && data.org}
  {#if ThemeComponent && landingPageProps}
    <ThemeComponent {...landingPageProps} />
  {:else}
    <PageLoader />
  {/if}
{:else if DashboardEntry}
  <DashboardEntry />
{:else}
  <div class="m-2 flex h-screen w-screen flex-col items-center justify-center font-sans sm:m-0">
    <SimpleLogoNav />
    <Spinner class="size-14! text-blue-700!" />
  </div>
{/if}
