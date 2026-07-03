<script lang="ts">
  import { fly } from 'svelte/transition';
  import { onMount, type Component } from 'svelte';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import type { AccountOrg } from '$features/app/types';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { orgApi } from '$features/org/api/org.svelte';
  import { landingPageSettings, landingPageEditorSelection } from '$features/settings/utils/store';
  import { buildOrgLandingPageProps, normalizeLandingPageSettings } from '$features/org/utils/landing-page';
  import { landingPageThemeComponents } from '$features/org/utils/landing-page-components';
  import { landingPageThemes } from '$features/org/utils/landing-page';
  import LandingpageEditor from '$features/settings/pages/landingpage-editor.svelte';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { setLandingPageEditContext, type LandingSectionKey } from '@cio/ui/custom/org-landing-page';
  import {
    ContentIcon,
    ExploreIcon,
    ExternalLinkIcon,
    GoalIcon,
    HeaderIcon,
    SettingsIcon
  } from '@cio/ui/custom/moving-icons';
  import { basePath } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';

  const sectionIcons: Record<LandingSectionKey, Component> = {
    navigation: ContentIcon,
    hero: HeaderIcon,
    links: ExploreIcon,
    embed: ExternalLinkIcon,
    callout: GoalIcon,
    footer: SettingsIcon
  };

  // Reset selection on every mount so the editor opens to the section list.
  landingPageEditorSelection.set(null);

  // Mirror the store into a $state so the preview's wrappers ($derived) react
  // to selection changes. Reading store via get() inside an arrow is non-reactive.
  let selectedSectionKey = $state<LandingSectionKey | null>(null);
  $effect(() => landingPageEditorSelection.subscribe((value) => (selectedSectionKey = value)));

  setLandingPageEditContext({
    selectedKey: () => selectedSectionKey,
    selectKey: (key) => landingPageEditorSelection.set(key),
    labelFor: (key) => t.get(`settings.landing_page.editor.sections.${key}`),
    iconFor: (key) => sectionIcons[key]
  });

  function handlePreviewClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('[data-landing-section]')) return;
    landingPageEditorSelection.set(null);
  }

  let sidebarOpen = $state(true);
  let hasInitialized = $state(false);

  function isLandingPageTheme(value: string | null): value is (typeof landingPageThemes)[number] {
    if (value === null) return false;
    return (landingPageThemes as readonly string[]).includes(value);
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

  const coursesLoaded = $derived(!$currentOrg.siteName || orgApi.publicCoursesLoadedSiteName === $currentOrg.siteName);

  const previewProps = $derived(
    buildOrgLandingPageProps(
      $currentOrg,
      previewLandingPageSettings,
      orgApi.publicCourses,
      orgApi.hasMorePublicCourses,
      authAction,
      { coursesLoaded }
    )
  );

  const ThemeComponent = $derived(landingPageThemeComponents[previewTheme] ?? landingPageThemeComponents.minimal);

  onMount(() => {
    if ($currentOrg.siteName) {
      void orgApi.loadPublicCoursesIfNeeded($currentOrg.siteName);
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
  <Sidebar.Provider bind:open={sidebarOpen} style="--sidebar-width: 360px; --sidebar-width-icon: 4rem">
    <Sidebar.Root side="left" collapsible="icon" class="h-full">
      <LandingpageEditor
        bind:settings={$landingPageSettings}
        onSave={async () => {
          const updatedLandingPage = normalizeLandingPageSettings({
            ...$landingPageSettings,
            theme: previewTheme
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
      onclick={handlePreviewClick}
    >
      <div class="absolute top-2 left-2 z-60">
        <Sidebar.Trigger variant="secondary" />
      </div>

      <ThemeComponent {...previewProps} disableCourseLinks={true} />
    </Sidebar.Inset>
  </Sidebar.Provider>
</div>
