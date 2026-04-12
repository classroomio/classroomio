<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';

  import { basePath } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';
  import { CourseLandingPage } from '$features/ui';
  import { PoweredBy } from '$features/ui';
  import { normalizeLandingPageSettings, importThemeComponent } from '$features/org/utils/landing-page';

  import { OrgLandingPageFooter } from '@cio/ui/custom/org-landing-page';
  import type { Component } from 'svelte';

  let { data } = $props();

  const landingSettings = $derived(normalizeLandingPageSettings(data.org?.landingpage));

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

  const shellClass = $derived(
    landingSettings.theme === 'classic'
      ? 'ui:min-h-screen ui:bg-muted/10 ui:text-foreground ui:font-sans'
      : 'ui:min-h-screen ui:bg-background ui:text-foreground ui:font-sans'
  );

  const courseHero = $derived.by(() => {
    if (!data.course) {
      return landingSettings.hero;
    }

    return {
      ...landingSettings.hero,
      heading: data.course.title,
      subheading: data.course.description || landingSettings.hero.subheading,
      primaryAction: {
        label: t.get('course.navItem.landing_page.start_course'),
        href: resolve(`/course/${data.course.slug}/enroll`, {})
      },
      image: data.course.logo || landingSettings.hero.image
    };
  });

  const orgName = $derived(data.org?.name ?? data.course?.org?.name ?? 'ClassroomIO');
  const logoUrl = $derived(data.org?.avatarUrl ?? undefined);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let NavComponent = $state<Component<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let HeroComponent = $state<Component<any> | null>(null);

  onMount(async () => {
    const theme = landingSettings.theme;

    const [navMod, heroMod] = await Promise.all([
      theme === 'bold'
        ? import('@cio/ui/custom/org-landing-page/bold/nav.svelte')
        : theme === 'classic'
          ? import('@cio/ui/custom/org-landing-page/classic/nav.svelte')
          : import('@cio/ui/custom/org-landing-page/minimal/nav.svelte'),
      theme === 'bold'
        ? import('@cio/ui/custom/org-landing-page/bold/hero.svelte')
        : theme === 'classic'
          ? import('@cio/ui/custom/org-landing-page/classic/hero.svelte')
          : import('@cio/ui/custom/org-landing-page/minimal/hero.svelte')
    ]);

    NavComponent = navMod.default;
    HeroComponent = heroMod.default;
  });
</script>

{#if data.course}
  <PoweredBy />

  <main class={shellClass}>
    {#if NavComponent && HeroComponent}
      {#if landingSettings.theme === 'minimal'}
        <HeroComponent hero={courseHero}>
          {#snippet navigation()}
            <NavComponent {orgName} {logoUrl} navItems={landingSettings.navItems} {authAction} />
          {/snippet}
        </HeroComponent>
      {:else}
        <NavComponent {orgName} {logoUrl} navItems={landingSettings.navItems} {authAction} />
        <HeroComponent hero={courseHero} />
      {/if}
    {/if}

    <CourseLandingPage courseData={data.course} showStandaloneShell={false} />

    <OrgLandingPageFooter
      {orgName}
      {logoUrl}
      footerLinks={landingSettings.footerLinks}
      footerText={landingSettings.footerText}
      variant={landingSettings.theme}
    />
  </main>
{/if}
