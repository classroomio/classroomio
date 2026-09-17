<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import XIcon from '@lucide/svelte/icons/x';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Tabs from '@cio/ui/base/tabs';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { mockOrgLandingPageProps, mockCourseLandingPageProps } from '@cio/ui/custom/org-landing-page';
  import {
    landingPageThemeComponents,
    courseLandingPageThemeComponents
  } from '$features/org/utils/landing-page-components';
  import { landingPageThemes } from '$features/org/utils/landing-page';
  import { t } from '$lib/utils/functions/translations';

  type LandingPageTheme = (typeof landingPageThemes)[number];
  type PreviewView = 'home' | 'course';

  const validThemes = new Set<LandingPageTheme>(landingPageThemes);

  const previewTheme = $derived.by<LandingPageTheme | null>(() => {
    const value = page.url.searchParams.get('preview');
    return value && validThemes.has(value as LandingPageTheme) ? (value as LandingPageTheme) : null;
  });

  const open = $derived(previewTheme !== null);

  let previewView = $state<PreviewView>('home');

  // Reset to the home view whenever a different theme is opened for preview.
  $effect(() => {
    if (previewTheme) {
      previewView = 'home';
    }
  });

  const ThemeComponent = $derived(
    previewTheme ? (landingPageThemeComponents[previewTheme] ?? landingPageThemeComponents.minimal) : null
  );

  const CourseComponent = $derived(
    previewTheme ? (courseLandingPageThemeComponents[previewTheme] ?? courseLandingPageThemeComponents.minimal) : null
  );

  const orgPreviewProps = $derived({
    ...mockOrgLandingPageProps,
    embed: undefined
  });

  const coursePreviewProps = $derived({
    ...mockCourseLandingPageProps,
    theme: previewTheme ?? mockCourseLandingPageProps.theme
  });

  function closePreview() {
    const nextUrl = new URL(page.url);
    nextUrl.searchParams.delete('preview');
    goto(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`, {
      replaceState: false,
      keepFocus: true,
      noScroll: true
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && open) {
      closePreview();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content
    showCloseButton={false}
    class="h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[calc(100vw-2rem)]"
  >
    <Dialog.Title class="sr-only">Theme preview</Dialog.Title>
    <Dialog.Description class="sr-only">Preview the selected landing page theme with sample content.</Dialog.Description
    >

    <div class="absolute top-3 right-3 z-[9999]">
      <IconButton variant="secondary" aria-label="Close preview" onclick={closePreview}>
        <XIcon size={16} />
      </IconButton>
    </div>

    <div class="h-full w-full overflow-y-auto">
      {#if previewView === 'home' && ThemeComponent}
        <ThemeComponent {...orgPreviewProps} disableCourseLinks={true} />
      {:else if previewView === 'course' && CourseComponent}
        <CourseComponent {...coursePreviewProps} />
      {/if}
    </div>

    <Tabs.Root
      bind:value={previewView}
      class="pointer-events-none absolute bottom-6 left-1/2 z-[9999] -translate-x-1/2"
    >
      <Tabs.List
        aria-label={$t('settings.landing_page.preview_tabs.label')}
        class="ui:bg-background/90 ui:supports-[backdrop-filter]:bg-background/70 pointer-events-auto h-10 gap-1 rounded-full border p-1 shadow-lg backdrop-blur"
      >
        <Tabs.Trigger value="home" class="rounded-full px-4">
          {$t('settings.landing_page.preview_tabs.home')}
        </Tabs.Trigger>
        <Tabs.Trigger value="course" class="rounded-full px-4">
          {$t('settings.landing_page.preview_tabs.course')}
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  </Dialog.Content>
</Dialog.Root>
