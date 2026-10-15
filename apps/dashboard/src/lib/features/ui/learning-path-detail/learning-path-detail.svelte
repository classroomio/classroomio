<script lang="ts">
  import type { Component } from 'svelte';
  import { resolve } from '$app/paths';

  import { currentOrg } from '$lib/utils/store/org';
  import { user } from '$lib/utils/store/user';

  import { importLearningPathLandingPageTheme, normalizeLandingPageSettings } from '$features/org/utils/landing-page';
  import { appInitApi } from '$features/app/init.svelte';
  import { getOrgLandingAuthAction } from '$features/org/utils/org-landing-auth-action';
  import type { AccountOrg, PublicOrg } from '$features/app/types';
  import type { LearningPathDetail as LearningPathDetailData } from '@cio/ui/custom/org-landing-page';
  import { buildLearningPathLandingPageProps } from './utils';

  interface Props {
    detail: LearningPathDetailData;
    org?: AccountOrg | PublicOrg | null;
    /** Pre-resolved theme component from the route's load function (eliminates the flash on SSR pages). */
    themeComponent?: Component | null;
  }

  let { detail, org = null, themeComponent = null }: Props = $props();

  const activeOrg = $derived(org ?? $currentOrg);
  const landingSettings = $derived(normalizeLandingPageSettings(activeOrg.landingpage));

  const authAction = $derived(
    getOrgLandingAuthAction({
      isLoggedIn: $user.isLoggedIn,
      isInitialized: appInitApi.isInitializedAndReady,
      org: activeOrg,
      organizations: appInitApi.data?.success ? appInitApi.data.organizations : [],
      hasPendingInvite: !!appInitApi.pendingOrgInvite
    })
  );

  const firstSeriesSlug = $derived(detail.series[0]?.slug);

  const enrollHref = $derived(firstSeriesSlug ? resolve(`/course/${firstSeriesSlug}/enroll`, {}) : '#');

  const landingProps = $derived(buildLearningPathLandingPageProps(detail, activeOrg, { enrollHref, authAction }));

  let importedThemeComponent = $state<Component | null>(null);
  const ThemeComponent = $derived(themeComponent ?? importedThemeComponent);

  $effect(() => {
    // Skip client-side loading if the theme was already resolved server-side.
    if (themeComponent) {
      return;
    }

    const theme = landingSettings.theme;
    let cancelled = false;

    void importLearningPathLandingPageTheme(theme).then((mod) => {
      if (!cancelled) {
        importedThemeComponent = mod.default;
      }
    });

    return () => {
      cancelled = true;
    };
  });
</script>

{#if ThemeComponent}
  <ThemeComponent {...landingProps} />
{/if}
