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
  import StudioLandingPage from './studio-landing-page.svelte';
  import {
    isLandingPagePresentationV1,
    type LandingPagePresentationV1,
    type LandingPageRenderData
  } from '@cio/landing-pages';

  interface Props {
    orgSiteName?: string;
    org: AccountOrg;
  }

  let { orgSiteName = '', org }: Props = $props();

  let hasLoadedCourses = $state(false);
  let ThemeComponent = $state<Component | null>(null);

  const studioPresentation = $derived.by<LandingPagePresentationV1 | null>(() => {
    const raw = (org.landingpage as Record<string, unknown> | null)?.presentation;
    return isLandingPagePresentationV1(raw) ? raw : null;
  });

  const studioRenderData = $derived.by<LandingPageRenderData>(() => {
    const siteName = orgSiteName || org.siteName || '';

    return {
      organization: {
        id: org.id,
        name: org.name ?? '',
        logoUrl: org.avatarUrl ?? null,
        slug: siteName
      },
      courses: (orgApi.publicCourses ?? []).map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description ?? null,
        slug: c.slug,
        image: c.image ?? null,
        isPricing: Boolean(c.isPricing),
        cost: c.cost ?? null,
        currency: c.currency ?? '$',
        totalLessons: c.totalLessons ?? c.lessonsCount ?? 0
      })),
      auth: {
        isAuthenticated: Boolean($user?.id),
        user: $user ? { id: $user.id, name: $profile?.fullname, email: $user.email } : null,
        dashboardUrl: siteName ? `/org/${siteName}` : '/home',
        loginUrl: '/login',
        signupUrl: '/signup'
      }
    };
  });

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

{#if studioPresentation && studioRenderData}
  <StudioLandingPage presentation={studioPresentation} renderData={studioRenderData} />
{:else if !ThemeComponent || !hasLoadedCourses || orgApi.isFetchingOrgPublicCourses}
  <PageLoader />
{:else}
  <ThemeComponent {...landingPageProps} />
{/if}
