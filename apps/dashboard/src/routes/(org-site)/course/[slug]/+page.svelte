<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  import { basePath } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';
  import { CourseLandingPage } from '$features/ui';
  import { PoweredBy } from '$features/ui';
  import {
    importThemeNavHero,
    normalizeLandingPageSettings,
    themeHeaderShellClass,
    themeStyle,
    themeRendersNavInsideHero
  } from '$features/org/utils/landing-page';

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

  const shellClass = $derived(`ui:min-h-screen ${themeHeaderShellClass(landingSettings.theme)}`);
  const shellStyle = $derived(themeStyle(landingSettings.theme));
  const navInsideHero = $derived(themeRendersNavInsideHero(landingSettings.theme));

  const courseHero = $derived.by(() => {
    if (!data.course) {
      return landingSettings.hero;
    }

    const enrollmentsOpen = data.course.metadata?.allowNewStudent === true;

    return {
      ...landingSettings.hero,
      heading: data.course.title,
      subheading: data.course.description || landingSettings.hero.subheading,
      primaryAction: {
        label: t.get('course.navItem.landing_page.start_course'),
        href: resolve(`/course/${data.course.slug}/enroll`, {}),
        disabled: !enrollmentsOpen
      },
      image: data.course.logo || landingSettings.hero.image
    };
  });

  const orgName = $derived(data.org?.name ?? data.course?.org?.name ?? 'ClassroomIO');
  const logoUrl = $derived(data.org?.avatarUrl ?? undefined);

  const courseJsonLd = $derived.by(() => {
    if (!data.course) return null;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: data.course.title,
      description: data.course.description || '',
      provider: {
        '@type': 'Organization',
        name: orgName
      },
      url: page.url.href,
      ...(data.course.logo ? { image: data.course.logo } : {})
    };

    return JSON.stringify(schema).replace(/</g, '\\u003c');
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let NavComponent = $state<Component<any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let HeroComponent = $state<Component<any> | null>(null);

  onMount(async () => {
    const { NavComponent: nav, HeroComponent: hero } = await importThemeNavHero(landingSettings.theme);
    NavComponent = nav;
    HeroComponent = hero;
  });
</script>

<svelte:head>
  {#if courseJsonLd}
    {@html `<script type="application/ld+json">${courseJsonLd}</script>`}
  {/if}
</svelte:head>

{#if data.course}
  <PoweredBy />

  <main class={shellClass} style={shellStyle}>
    {#if NavComponent && HeroComponent}
      {#if navInsideHero}
        <HeroComponent hero={courseHero} {orgName}>
          {#snippet navigation()}
            <NavComponent {orgName} {logoUrl} navItems={landingSettings.navItems} {authAction} />
          {/snippet}
        </HeroComponent>
      {:else}
        <NavComponent {orgName} {logoUrl} navItems={landingSettings.navItems} {authAction} />
        <HeroComponent hero={courseHero} {orgName} />
      {/if}
    {/if}

    <CourseLandingPage courseData={data.course} />

    <OrgLandingPageFooter {orgName} {logoUrl} footer={landingSettings.footer} variant={landingSettings.theme} />
  </main>
{/if}
