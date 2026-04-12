<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import type { Component } from 'svelte';

  import { orgApi } from '$features/org/api/org.svelte';
  import PageLoader from './page-loader.svelte';
  import type { AccountOrg } from '$features/app/types';
  import {
    buildOrgLandingPageProps,
    importThemeComponent,
    normalizeLandingPageSettings
  } from '$features/org/utils/landing-page';
  import { basePath } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';

  interface Props {
    orgSiteName?: string;
    org: AccountOrg;
  }

  let { orgSiteName = '', org }: Props = $props();

  let hasLoadedCourses = $state(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ThemeComponent = $state<Component<any> | null>(null);

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

  const landingPageProps = $derived(
    buildOrgLandingPageProps(
      org,
      normalizeLandingPageSettings(org.landingpage),
      orgApi.publicCourses,
      orgApi.hasMorePublicCourses,
      authAction
    )
  );

  onMount(async () => {
    const settings = normalizeLandingPageSettings(org.landingpage);
    const mod = await importThemeComponent(settings.theme);
    ThemeComponent = mod.default;

    const siteName = orgSiteName || org.siteName;
    if (!siteName) {
      hasLoadedCourses = true;
      return;
    }

    orgApi.publicCourses = [];
    orgApi.hasMorePublicCourses = false;
    hasLoadedCourses = false;
    void orgApi.getPublicCoursesBySiteName(siteName).finally(() => {
      hasLoadedCourses = true;
    });
  });
</script>

{#if !ThemeComponent || !hasLoadedCourses || orgApi.isFetchingOrgPublicCourses}
  <PageLoader />
{:else}
  <ThemeComponent {...landingPageProps} />
{/if}
