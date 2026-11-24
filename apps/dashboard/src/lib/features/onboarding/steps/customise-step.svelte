<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import type { TOnboardingBrandColour } from '@cio/utils/validation/onboarding';
  import { ErrorCodes, isFreeLandingPageTheme } from '@cio/utils/constants';
  import { onUpgradeCheckoutHandoff, openUpgradeModal } from '$lib/utils/store/upgrade-modal';
  import { hasErrorCode } from '$lib/utils/services/api';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { currentOrg, getOrgPublicOrigin, isFreePlan } from '$lib/utils/store/org';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { orgApi } from '$features/org/api/org.svelte';
  import { onboardingFlowApi } from '$features/onboarding/api/onboarding-flow.svelte';
  import {
    brandPrimary,
    brandPrimaryForeground,
    HEX_COLOUR_PATTERN,
    isBrandPreset
  } from '$features/onboarding/utils/customise-colour';
  import {
    clearCustomiseHandoff,
    readCustomiseHandoff,
    writeCustomiseHandoff
  } from '$features/onboarding/utils/customise-theme';
  import {
    buildOrgLandingPageProps,
    DEFAULT_LANDING_PAGE_THEME,
    landingPageThemes,
    normalizeLandingPageSettings,
    type LandingPageThemeKey
  } from '$features/org/utils/landing-page';
  import { landingPageThemeComponents } from '$features/org/utils/landing-page-components';
  import type { OrgPublicCourses } from '$features/org/utils/types';
  import OnboardingLogo from '$features/onboarding/components/onboarding-logo.svelte';
  import CustomiseBrandPill from '$features/onboarding/components/customise/customise-brand-pill.svelte';
  import CustomiseThemeDock from '$features/onboarding/components/customise/customise-theme-dock.svelte';
  import CustomisePreviewFrame from '$features/onboarding/components/customise/customise-preview-frame.svelte';

  const flowState = $derived(onboardingFlowApi.state);

  const starter = $derived(onboardingFlowApi.starter);
  const detectedColour = $derived.by(() => {
    const colour = flowState?.brand.detectedColour;
    if (!colour || !HEX_COLOUR_PATTERN.test(colour)) return null;

    return colour.toLowerCase();
  });
  const detectedLogoUrl = $derived(flowState?.brand.detectedLogoUrl ?? null);

  let orgName = $state('');
  let brandColour = $state<TOnboardingBrandColour>('blue');
  let theme = $state<LandingPageThemeKey>(DEFAULT_LANDING_PAGE_THEME);
  let previewTheme = $state<LandingPageThemeKey | null>(null);
  let upgradeTheme = $state<LandingPageThemeKey | null>(null);
  let logoFile = $state<File | null>(null);
  let logoObjectUrl = $state<string | null>(null);
  let isUsingDetectedLogo = $state(false);
  let isLogoCleared = $state(false);

  const shownTheme = $derived(previewTheme ?? theme);
  const isPreviewingOther = $derived(previewTheme !== null && previewTheme !== theme);

  const logoUrl = $derived.by(() => {
    if (logoObjectUrl) return logoObjectUrl;
    if (isUsingDetectedLogo && detectedLogoUrl) return detectedLogoUrl;
    if (isLogoCleared) return null;

    return $currentOrg.avatarUrl || null;
  });

  const nameError = $derived.by(() => {
    const trimmed = orgName.trim();
    if (trimmed.length < 5) return $t('validations.organization_name.min_char');
    if (/^-|-$/.test(trimmed)) return $t('validations.organization_name.hyphen_rule');

    return '';
  });

  const orgInitials = $derived.by(() => {
    const parts = orgName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'A';

    return parts
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  });

  const primary = $derived(brandPrimary(brandColour));
  const primaryForeground = $derived(brandPrimaryForeground(brandColour));

  const normalizedLandingPage = $derived(
    normalizeLandingPageSettings({ ...(($currentOrg.landingpage ?? {}) as Record<string, unknown>), theme: shownTheme })
  );

  const previewOrg = $derived({ ...$currentOrg, name: orgName, avatarUrl: logoUrl ?? '' });

  const starterCourses = $derived(
    (starter?.drafts ?? []).map((draft) => ({
      id: draft.slot,
      title: draft.title,
      description: draft.description,
      bannerImage: draft.bannerPath,
      type: 'SELF_PACED',
      lessonCount: draft.lessonCount,
      isPublished: false
    })) as unknown as OrgPublicCourses
  );

  const previewProps = $derived(
    buildOrgLandingPageProps(
      previewOrg,
      normalizedLandingPage,
      starterCourses,
      false,
      { label: $t('navigation.login'), href: '#' },
      { coursesLoaded: true }
    )
  );

  const ThemeComponent = $derived(landingPageThemeComponents[shownTheme] ?? landingPageThemeComponents.quartz);

  const address = $derived(getOrgPublicOrigin({ ...$currentOrg, siteName: $currentOrg.siteName }));

  function themeTitle(candidate: LandingPageThemeKey) {
    return t.get(`settings.landing_page.theme.cards.${candidate}.title`);
  }

  function isLocked(candidate: LandingPageThemeKey) {
    return $isFreePlan && !isFreeLandingPageTheme(candidate);
  }

  function trackTheme(event: string, candidate: LandingPageThemeKey) {
    capturePosthogEvent(event, { theme: candidate, is_premium: !isFreeLandingPageTheme(candidate) });
  }

  function openThemeUpgrade(candidate: LandingPageThemeKey) {
    upgradeTheme = candidate;
    trackTheme('onboarding_upgrade_prompt_opened', candidate);
    openUpgradeModal();
  }

  function selectTheme(candidate: LandingPageThemeKey) {
    theme = candidate;
    previewTheme = null;
    trackTheme('onboarding_theme_selected', candidate);
  }

  function previewThemeLive(candidate: LandingPageThemeKey) {
    previewTheme = candidate === theme ? null : candidate;
    if (previewTheme) trackTheme('onboarding_theme_previewed', candidate);
  }

  function handleLogoFile(file: File) {
    if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl);

    logoFile = file;
    logoObjectUrl = URL.createObjectURL(file);
    isUsingDetectedLogo = false;
    isLogoCleared = false;
  }

  function handleLogoClear() {
    if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl);

    logoFile = null;
    logoObjectUrl = null;
    isUsingDetectedLogo = false;
    isLogoCleared = true;
  }

  function handleUseDetectedLogo() {
    handleLogoClear();
    isUsingDetectedLogo = true;
    isLogoCleared = false;
  }

  function defaultBrandColour(): TOnboardingBrandColour {
    return detectedColour ?? 'blue';
  }

  function resetColour() {
    brandColour = defaultBrandColour();
    snackbar.success('onboarding.v2.customise.colour_reset');
  }

  async function saveLogo() {
    const organizationId = $currentOrg.id;
    if (!organizationId) return;

    const avatar = logoFile ?? (isUsingDetectedLogo ? detectedLogoUrl : null) ?? (isLogoCleared ? '' : null);
    if (avatar === null) return;

    await orgApi.update(organizationId, { avatar }, { onSuccess: () => {} });
  }

  async function handleContinue() {
    if (nameError) return;

    await saveLogo();

    const applied = await onboardingFlowApi.applyCustomisation({
      orgName: orgName.trim(),
      brandColour,
      landingTheme: theme
    });

    const lastError = onboardingFlowApi.lastError;
    if (!applied) {
      if (lastError && hasErrorCode(lastError, ErrorCodes.UPGRADE_REQUIRED)) openThemeUpgrade(theme);

      return;
    }

    await onboardingFlowApi.complete('publish');
  }

  async function handleBack() {
    await goto(resolve('/onboarding/business', {}));
  }

  function restoreSavedDraft() {
    const current = flowState;
    if (!current) return;

    orgName = current.organization?.name ?? '';

    const savedTheme = current.organization?.landingTheme as LandingPageThemeKey | null;
    theme = savedTheme && landingPageThemes.includes(savedTheme) ? savedTheme : DEFAULT_LANDING_PAGE_THEME;

    const colour = current.organization?.theme;
    if (colour && (isBrandPreset(colour) || HEX_COLOUR_PATTERN.test(colour))) {
      brandColour = colour;
    } else {
      brandColour = defaultBrandColour();
    }
  }

  function restoreCheckoutHandoff() {
    const handoff = readCustomiseHandoff();
    if (!handoff) return;

    clearCustomiseHandoff();
    orgName = handoff.orgName;
    brandColour = handoff.brandColour;
    theme = handoff.theme;
    upgradeTheme = null;
  }

  onMount(() => {
    restoreSavedDraft();
    restoreCheckoutHandoff();
    void onboardingFlowApi.refreshStarter();

    const unregisterHandoff = onUpgradeCheckoutHandoff(() => {
      writeCustomiseHandoff({ orgName, brandColour, theme: upgradeTheme ?? theme });
    });

    return () => {
      unregisterHandoff();
      if (logoObjectUrl) URL.revokeObjectURL(logoObjectUrl);
    };
  });

  const badgeClass = $derived(
    isFreeLandingPageTheme(shownTheme)
      ? 'rounded-md border-transparent bg-green-600/12 px-2 py-0.5 text-xs font-medium text-green-600'
      : 'ui:text-primary rounded-md border-transparent bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] px-2 py-0.5 text-xs font-medium'
  );
</script>

<svelte:head>
  <title>{$t('onboarding.v2.customise.title')}</title>
</svelte:head>

<div
  class="ui:bg-background flex min-h-screen flex-col"
  style:--primary={primary}
  style:--primary-foreground={primaryForeground}
  style:--ring={primary}
  data-testid="onboarding-customise"
>
  <header
    class="ui:border-border sticky top-0 z-30 flex min-h-14 flex-wrap items-center gap-3 border-b bg-[color-mix(in_oklab,var(--background)_90%,transparent)] px-6 py-2.5 backdrop-blur-[8px] max-[900px]:static"
  >
    <OnboardingLogo class="pt-0 md:pt-0" />

    <div
      class="ui:text-muted-foreground flex items-center gap-2 text-[13.5px] whitespace-nowrap max-[900px]:order-5 max-[900px]:w-full"
      aria-live="polite"
    >
      <span>
        {isPreviewingOther
          ? $t('onboarding.v2.customise.previewing_label')
          : $t('onboarding.v2.customise.preview_label')}
        · <b class="ui:text-foreground font-semibold">{themeTitle(shownTheme)}</b>
      </span>
      <Badge class={badgeClass}>
        {isFreeLandingPageTheme(shownTheme)
          ? $t('onboarding.v2.customise.theme_free')
          : $t('onboarding.v2.customise.theme_premium')}
      </Badge>
    </div>

    <div class="ml-auto flex flex-wrap items-center gap-2 max-[900px]:ml-0">
      <Button variant="ghost" size="sm" onclick={handleBack}>
        {$t('onboarding.v2.common.back')}
      </Button>
      <Button loading={onboardingFlowApi.isSaving} onclick={handleContinue} testId="onboarding-customise-continue">
        {$t('onboarding.v2.common.continue')}
        <ArrowRightIcon class="custom size-4" />
      </Button>
    </div>
  </header>

  <main class="flex-1 px-6 pt-[22px] pb-[300px] max-[900px]:px-3">
    <div class="mx-auto flex w-full max-w-[1180px] flex-col gap-3">
      {#if isPreviewingOther && previewTheme}
        <div class="flex flex-wrap items-center justify-end gap-3">
          {#if isLocked(previewTheme)}
            <Button size="sm" onclick={() => openThemeUpgrade(previewTheme)} testId="onboarding-customise-use-theme">
              <ZapIcon class="custom size-3.5" aria-hidden="true" />
              {$t('onboarding.v2.customise.use_theme')}
            </Button>
          {:else}
            <Button size="sm" onclick={() => selectTheme(previewTheme)} testId="onboarding-customise-apply-theme">
              {$t('onboarding.v2.customise.apply_theme')}
            </Button>
          {/if}
        </div>
      {/if}

      <CustomisePreviewFrame {address}>
        <ThemeComponent {...previewProps} disableCourseLinks={true} />
      </CustomisePreviewFrame>
    </div>
  </main>

  <div class="pointer-events-none fixed inset-x-0 bottom-0 z-40">
    <div class="pointer-events-auto mx-auto mb-3 w-fit max-w-[calc(100%-24px)] max-[900px]:w-[calc(100vw-24px)]">
      <CustomiseBrandPill
        bind:orgName
        {nameError}
        initials={orgInitials}
        {logoUrl}
        detectedLogoUrl={logoUrl ? null : detectedLogoUrl}
        {brandColour}
        {detectedColour}
        colourAdjusted={Boolean(flowState?.brand.colourAdjusted)}
        onLogoFile={handleLogoFile}
        onLogoClear={handleLogoClear}
        onUseDetectedLogo={handleUseDetectedLogo}
        onColourChange={(colour) => (brandColour = colour)}
        onReset={resetColour}
      />
    </div>

    <div
      class="ui:bg-card ui:border-border pointer-events-auto border-t max-[900px]:max-h-[40vh] max-[900px]:overflow-y-auto"
    >
      <CustomiseThemeDock selected={theme} previewing={previewTheme} {isLocked} onPreview={previewThemeLive} />
    </div>
  </div>
</div>
