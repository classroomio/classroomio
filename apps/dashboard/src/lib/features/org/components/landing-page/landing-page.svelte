<script lang="ts">
  import { onMount } from 'svelte';
  import type { Component } from 'svelte';

  import { orgApi } from '$features/org/api/org.svelte';
  import { appInitApi } from '$features/app/init.svelte';
  import PageLoader from './page-loader.svelte';
  import type { AccountOrg } from '$features/app/types';
  import { page } from '$app/state';
  import {
    buildOrgLandingPageProps,
    importThemeComponent,
    normalizeLandingPageSettings
  } from '$features/org/utils/landing-page';
  import { user, profile } from '$lib/utils/store/user';
  import { resolveOrgLandingAuthAction } from '$features/org/utils/org-landing-auth-action';
  import { resolveOrgLandingLearnerAccount } from '$features/org/utils/org-landing-learner-account';

  interface Props {
    orgSiteName?: string;
    org: AccountOrg;
  }

  let { orgSiteName = '', org }: Props = $props();

  let hasLoadedCourses = $state(false);
  let ThemeComponent = $state<Component | null>(null);

  const authAction = $derived(
    resolveOrgLandingAuthAction({
      org,
      locals: page.data?.locals,
      user: $user,
      appInitApi
    })
  );

  const learnerAccount = $derived(
    resolveOrgLandingLearnerAccount({
      org,
      locals: page.data?.locals,
      user: $user,
      profile: $profile,
      appInitApi
    })
  );

  const landingPageProps = $derived(
    buildOrgLandingPageProps(
      org,
      normalizeLandingPageSettings(org.landingpage),
      orgApi.publicCourses,
      orgApi.hasMorePublicCourses,
      authAction,
      { coursesLoaded: hasLoadedCourses, learnerAccount }
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
