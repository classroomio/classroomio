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
    class="ui:w-[calc(100vw-2rem)] ui:h-[calc(100vh-2rem)] ui:max-w-[calc(100vw-2rem)] ui:max-h-[calc(100vh-2rem)] ui:overflow-hidden ui:p-0 ui:gap-0 ui:sm:max-w-[calc(100vw-2rem)]"
  >
    <Dialog.Title class="ui:sr-only">Theme preview</Dialog.Title>
    <Dialog.Description class="ui:sr-only"
      >Preview the selected landing page theme with sample content.</Dialog.Description
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
      class="ui:pointer-events-none ui:absolute ui:bottom-6 ui:left-1/2 ui:z-[9999] ui:-translate-x-1/2"
    >
      <Tabs.List
        aria-label={$t('settings.landing_page.preview_tabs.label')}
        class="ui:pointer-events-auto ui:bg-background/90 ui:supports-[backdrop-filter]:bg-background/70 ui:h-10 ui:gap-1 ui:rounded-full ui:border ui:p-1 ui:shadow-lg ui:backdrop-blur"
      >
        <Tabs.Trigger value="home" class="ui:rounded-full ui:px-4">
          {$t('settings.landing_page.preview_tabs.home')}
        </Tabs.Trigger>
        <Tabs.Trigger value="course" class="ui:rounded-full ui:px-4">
          {$t('settings.landing_page.preview_tabs.course')}
        </Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  </Dialog.Content>
</Dialog.Root>
