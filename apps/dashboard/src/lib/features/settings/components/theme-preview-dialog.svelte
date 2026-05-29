<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import XIcon from '@lucide/svelte/icons/x';
  import * as Dialog from '@cio/ui/base/dialog';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { mockOrgLandingPageProps } from '@cio/ui/custom/org-landing-page';
  import { landingPageThemeComponents } from '$features/org/utils/landing-page-components';
  import { landingPageThemes } from '$features/org/utils/landing-page';

  type LandingPageTheme = (typeof landingPageThemes)[number];

  const validThemes = new Set<LandingPageTheme>(landingPageThemes);

  const previewTheme = $derived.by<LandingPageTheme | null>(() => {
    const value = page.url.searchParams.get('preview');
    return value && validThemes.has(value as LandingPageTheme) ? (value as LandingPageTheme) : null;
  });

  const open = $derived(previewTheme !== null);

  const ThemeComponent = $derived(
    previewTheme ? (landingPageThemeComponents[previewTheme] ?? landingPageThemeComponents.minimal) : null
  );

  const previewProps = $derived({
    ...mockOrgLandingPageProps,
    embed: undefined
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
      {#if ThemeComponent}
        <ThemeComponent {...previewProps} disableCourseLinks={true} />
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
