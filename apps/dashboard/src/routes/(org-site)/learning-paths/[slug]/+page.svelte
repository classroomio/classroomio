<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';

  import { PoweredBy, LearningPathDetail } from '$features/ui';
  import { appInitApi } from '$features/app/init.svelte';
  import { getOrgLandingAuthAction } from '$features/org/utils/org-landing-auth-action';
  import { normalizeLandingPageSettings, themeRendersNavInsideHero } from '$features/org/utils/landing-page';
  import {
    LandingThemeScope,
    OrgLandingPageFooter,
    type LearningPathDetail as LearningPathDetailType
  } from '@cio/ui/custom/org-landing-page';

  let { data } = $props();

  const landingSettings = $derived(normalizeLandingPageSettings(data.org.landingpage));

  const authAction = $derived(
    getOrgLandingAuthAction({
      isLoggedIn: $user.isLoggedIn,
      isInitialized: appInitApi.isInitializedAndReady,
      org: data.org,
      organizations: appInitApi.data?.success ? appInitApi.data.organizations : [],
      hasPendingInvite: !!appInitApi.pendingOrgInvite
    })
  );

  const navInsideHero = $derived(themeRendersNavInsideHero(landingSettings.theme));

  const NavComponent = $derived(data.theme.Nav);
  const HeroComponent = $derived(data.theme.Hero);

  const detail: LearningPathDetailType = $derived(data.detail);

  const jsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: detail.title,
      description: detail.description,
      provider: {
        '@type': 'Organization',
        name: data.org.name
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        courseWorkload: detail.totalHours
      },
      numberOfCredits: detail.courseCount,
      offers: {
        '@type': 'Offer',
        price: detail.cost,
        priceCurrency: detail.currency
      },
      hasPart: detail.series.map((course) => ({
        '@type': 'Course',
        name: course.title,
        description: course.description,
        isAccessibleForFree: course.cost === 0
      }))
    })
  );
</script>

{@html `<script type="application/ld+json">${jsonLd}</script>`}

<PoweredBy />

<LandingThemeScope theme={landingSettings.theme} class="font-sans">
  <main>
    {#if navInsideHero}
      <HeroComponent hero={landingSettings.hero} orgName={data.org.name} showActions={false} compact={true}>
        {#snippet navigation()}
          <NavComponent
            orgName={data.org.name}
            logoUrl={data.org.avatarUrl ?? undefined}
            navItems={landingSettings.navItems}
            {authAction}
          />
        {/snippet}
      </HeroComponent>
    {:else}
      <NavComponent
        orgName={data.org.name}
        logoUrl={data.org.avatarUrl ?? undefined}
        navItems={landingSettings.navItems}
        {authAction}
      />
      <HeroComponent hero={landingSettings.hero} orgName={data.org.name} showActions={false} compact={true} />
    {/if}

    <LearningPathDetail {detail} orgName={data.org.name} />

    <OrgLandingPageFooter
      orgName={data.org.name}
      logoUrl={data.org.avatarUrl ?? undefined}
      footer={landingSettings.footer}
      variant={landingSettings.theme}
    />
  </main>
</LandingThemeScope>
