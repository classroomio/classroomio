<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import XIcon from '@lucide/svelte/icons/x';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Tabs from '@cio/ui/base/tabs';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { mockOrgLandingPageProps, mockCourseLandingPageProps } from '@cio/ui/custom/org-landing-page';
  import {
    landingPageThemeComponents,
    courseLandingPageThemeComponents
  } from '$features/org/utils/landing-page-components';
  import { landingPageThemes } from '$features/org/utils/landing-page';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { classroomio } from '$lib/utils/services/api';
  import { PublicPluginLandingFrame } from '$features/org';
  import {
    projectPublicLandingPageViewModel,
    type PublicLandingPluginDescriptor
  } from '@cio/utils/validation/organization';

  interface Props {
    onApplyTemplate?: (templateId: string, installationId?: string, contributionId?: string) => Promise<void> | void;
  }

  let { onApplyTemplate }: Props = $props();

  type LandingPageTheme = (typeof landingPageThemes)[number];
  type PreviewView = 'home' | 'course';

  const validThemes = new Set<LandingPageTheme>(landingPageThemes);

  const previewParam = $derived(page.url.searchParams.get('preview'));
  const previewInstallationId = $derived(page.url.searchParams.get('pluginInstallationId'));
  const previewContributionId = $derived(page.url.searchParams.get('pluginContributionId'));
  const isNative = $derived(previewParam ? validThemes.has(previewParam as LandingPageTheme) : false);
  const previewNativeTheme = $derived(isNative ? (previewParam as LandingPageTheme) : null);
  const isPluginPreview = $derived(
    Boolean(previewParam && !isNative && previewInstallationId && previewContributionId)
  );
  const open = $derived(Boolean(previewParam));

  let previewView = $state<PreviewView>('home');
  let pluginDescriptor = $state<PublicLandingPluginDescriptor | null>(null);
  let isLoadingPluginDescriptor = $state(false);

  // Reset to the home view whenever a different theme is opened for preview.
  $effect(() => {
    if (previewParam) {
      previewView = 'home';
    }
  });

  $effect(() => {
    if (!isPluginPreview || !previewParam || !previewInstallationId || !previewContributionId) {
      pluginDescriptor = null;
      isLoadingPluginDescriptor = false;
      return;
    }

    let isCancelled = false;
    isLoadingPluginDescriptor = true;

    void (async () => {
      try {
        const res = await classroomio.organization['landing-page']['plugin-template'].preview.$get({
          query: {
            installationId: previewInstallationId,
            contributionId: previewContributionId,
            templateId: previewParam
          }
        });
        if (!isCancelled && res.ok) {
          const body = await res.json();
          if (body.success) {
            pluginDescriptor = body.data;
          }
        }
      } catch {
        if (!isCancelled) pluginDescriptor = null;
      } finally {
        if (!isCancelled) isLoadingPluginDescriptor = false;
      }
    })();

    return () => {
      isCancelled = true;
    };
  });

  const ThemeComponent = $derived(
    previewNativeTheme ? (landingPageThemeComponents[previewNativeTheme] ?? landingPageThemeComponents.minimal) : null
  );

  const CourseComponent = $derived(
    previewNativeTheme
      ? (courseLandingPageThemeComponents[previewNativeTheme] ?? courseLandingPageThemeComponents.minimal)
      : null
  );

  const orgPreviewProps = $derived({
    ...mockOrgLandingPageProps,
    embed: undefined
  });

  const coursePreviewProps = $derived({
    ...mockCourseLandingPageProps,
    theme: previewNativeTheme ?? mockCourseLandingPageProps.theme
  });

  function closePreview() {
    const nextUrl = new URL(page.url);
    nextUrl.searchParams.delete('preview');
    nextUrl.searchParams.delete('pluginInstallationId');
    nextUrl.searchParams.delete('pluginContributionId');
    goto(resolve(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`, {}), {
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

  async function handleApplyCurrent() {
    if (!previewParam || !onApplyTemplate) return;
    await onApplyTemplate(previewParam, previewInstallationId ?? undefined, previewContributionId ?? undefined);
    closePreview();
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content
    showCloseButton={false}
    class="h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)]! max-w-[calc(100vw-2rem)]! gap-0 overflow-hidden p-0 sm:max-w-[calc(100vw-2rem)]! md:max-w-[calc(100vw-2rem)]!"
  >
    <Dialog.Title class="sr-only">Theme preview</Dialog.Title>
    <Dialog.Description class="sr-only">Preview the selected landing page theme with sample content.</Dialog.Description
    >

    <div class="absolute top-3 right-3 z-[9999] flex items-center gap-2">
      {#if onApplyTemplate && previewParam}
        <Button size="sm" onclick={handleApplyCurrent}>Use This Template</Button>
      {/if}
      <IconButton variant="secondary" aria-label="Close preview" onclick={closePreview}>
        <XIcon size={16} />
      </IconButton>
    </div>

    <div class="h-full w-full overflow-y-auto">
      {#if isPluginPreview}
        {#if pluginDescriptor}
          <PublicPluginLandingFrame
            srcUrl={pluginDescriptor.entrypointUrl}
            viewModel={projectPublicLandingPageViewModel({
              theme: previewParam,
              templateId: previewParam,
              org: { ...$currentOrg, locale: $currentOrg.settings?.language?.locale },
              landingpage: orgPreviewProps,
              courses: mockOrgLandingPageProps.courses ?? [],
              hasMoreCourses: false,
              isAuthenticated: false
            })}
          />
        {:else if isLoadingPluginDescriptor}
          <div class="flex h-full w-full items-center justify-center p-12">
            <div class="text-muted-foreground flex flex-col items-center gap-3 text-sm">
              <span class="border-primary inline-block size-6 animate-spin rounded-full border-2 border-t-transparent"
              ></span>
              <span>Loading template preview…</span>
            </div>
          </div>
        {/if}
      {:else}
        <div inert>
          {#if previewView === 'home' && ThemeComponent}
            <ThemeComponent {...orgPreviewProps} disableCourseLinks={true} />
          {:else if previewView === 'course' && CourseComponent}
            <CourseComponent {...coursePreviewProps} />
          {/if}
        </div>
      {/if}
    </div>

    {#if !isPluginPreview}
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
    {/if}
  </Dialog.Content>
</Dialog.Root>
