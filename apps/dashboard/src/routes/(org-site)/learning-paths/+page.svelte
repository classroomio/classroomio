<script lang="ts">
  import { resolve } from '$app/paths';
  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';
  import { basePath } from '$lib/utils/store/app';
  import { PoweredBy } from '$features/ui';
  import RouteIcon from '@lucide/svelte/icons/route';
  import { normalizeLandingPageSettings, themeRendersNavInsideHero } from '$features/org/utils/landing-page';

  import { LandingThemeScope, LearningPathCard, OrgLandingPageFooter } from '@cio/ui/custom/org-landing-page';
  import { Empty } from '@cio/ui/custom/empty';

  let { data } = $props();

  const landingSettings = $derived(normalizeLandingPageSettings(data.org.landingpage));

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

  const navInsideHero = $derived(themeRendersNavInsideHero(landingSettings.theme));

  const NavComponent = $derived(data.theme.Nav);
  const HeroComponent = $derived(data.theme.Hero);

  const heroProps = $derived({
    ...landingSettings.hero,
    heading: t.get('public_learning_paths.heading'),
    subheading: t.get('public_learning_paths.subtitle'),
    image: ''
  });
</script>

<PoweredBy />

<LandingThemeScope theme={landingSettings.theme} class="ui:font-sans">
  <main>
    {#if navInsideHero}
      <HeroComponent hero={heroProps} orgName={data.org.name} showActions={false} compact={true}>
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
      <HeroComponent hero={heroProps} orgName={data.org.name} showActions={false} compact={true} />
    {/if}

    <section class="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      {#if data.learningPaths.length === 0}
        <Empty
          icon={RouteIcon}
          title={$t('public_learning_paths.empty.title')}
          description={$t('public_learning_paths.empty.description')}
          variant="page"
        />
      {:else}
        <div class="ui:@container ui:grid ui:grid-cols-1 ui:md:grid-cols-2 ui:lg:grid-cols-3 ui:gap-6">
          {#each data.learningPaths as path (path.id)}
            <LearningPathCard {path} />
          {/each}
        </div>
      {/if}
    </section>

    <OrgLandingPageFooter
      orgName={data.org.name}
      logoUrl={data.org.avatarUrl ?? undefined}
      footer={landingSettings.footer}
      variant={landingSettings.theme}
    />
  </main>
</LandingThemeScope>
