<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import LayoutTemplateIcon from '@lucide/svelte/icons/layout-template';
  import PaintbrushIcon from '@lucide/svelte/icons/paintbrush';
  import ZapIcon from '@lucide/svelte/icons/zap';

  import { currentOrg, currentOrgPath, isFreePlan } from '$lib/utils/store/org';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';
  import { basePath } from '$lib/utils/store/app';
  import type { AccountOrg } from '$features/app/types';
  import { orgApi } from '$features/org/api/org.svelte';
  import { snackbar } from '$features/ui/snackbar/store';

  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import * as Card from '@cio/ui/base/card';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { PremiumIcon } from '@cio/ui/custom/moving-icons';

  import ThemePreviewDialog from '$features/settings/components/theme-preview-dialog.svelte';

  import {
    createDefaultLandingPageSettings,
    landingPageThemes,
    normalizeLandingPageSettings,
    buildOrgLandingPageProps
  } from '$features/org/utils/landing-page';
  import { landingPageThemeComponents } from '$features/org/utils/landing-page-components';

  type LandingPageTheme = (typeof landingPageThemes)[number];

  let normalized = $state(createDefaultLandingPageSettings());
  let hasInitialized = $state(false);

  $effect(() => {
    if (hasInitialized || !$currentOrg.id) return;

    normalized = normalizeLandingPageSettings($currentOrg.landingpage);
    hasInitialized = true;
  });

  const currentTheme = $derived(normalized.theme as LandingPageTheme);

  const themeCards = [
    {
      value: 'minimal',
      preview: '/templates/minimal.png',
      titleKey: 'settings.landing_page.theme.cards.minimal.title',
      descriptionKey: 'settings.landing_page.theme.cards.minimal.description'
    },
    {
      value: 'bold',
      preview: '/templates/bold.png',
      titleKey: 'settings.landing_page.theme.cards.bold.title',
      descriptionKey: 'settings.landing_page.theme.cards.bold.description'
    },
    {
      value: 'classic',
      preview: '/templates/classic.png',
      titleKey: 'settings.landing_page.theme.cards.classic.title',
      descriptionKey: 'settings.landing_page.theme.cards.classic.description'
    },
    {
      value: 'saas',
      preview: '/templates/saas.png',
      titleKey: 'settings.landing_page.theme.cards.saas.title',
      descriptionKey: 'settings.landing_page.theme.cards.saas.description'
    },
    {
      value: 'tech',
      preview: '/templates/tech.png',
      titleKey: 'settings.landing_page.theme.cards.tech.title',
      descriptionKey: 'settings.landing_page.theme.cards.tech.description'
    },
    {
      value: 'studio',
      preview: '/templates/studio.png',
      titleKey: 'settings.landing_page.theme.cards.studio.title',
      descriptionKey: 'settings.landing_page.theme.cards.studio.description'
    },
    {
      value: 'corporate',
      preview: '/templates/corporate.png',
      titleKey: 'settings.landing_page.theme.cards.corporate.title',
      descriptionKey: 'settings.landing_page.theme.cards.corporate.description'
    },
    {
      value: 'terminal',
      preview: '/templates/terminal.png',
      titleKey: 'settings.landing_page.theme.cards.terminal.title',
      descriptionKey: 'settings.landing_page.theme.cards.terminal.description'
    },
    {
      value: 'editorial',
      preview: '/templates/editorial.png',
      titleKey: 'settings.landing_page.theme.cards.editorial.title',
      descriptionKey: 'settings.landing_page.theme.cards.editorial.description'
    },
    {
      value: 'vibrant',
      preview: '/templates/vibrant.png',
      titleKey: 'settings.landing_page.theme.cards.vibrant.title',
      descriptionKey: 'settings.landing_page.theme.cards.vibrant.description'
    }
  ] as const satisfies ReadonlyArray<{
    value: LandingPageTheme;
    preview: string;
    titleKey: string;
    descriptionKey: string;
  }>;

  const currentThemeCard = $derived(themeCards.find((card) => card.value === currentTheme) ?? themeCards[0]);
  const otherThemeCards = $derived(themeCards.filter((card) => card.value !== currentTheme));

  function isPaidTheme(theme: LandingPageTheme): boolean {
    return theme !== 'minimal';
  }

  const authAction = $derived(
    $user.isLoggedIn
      ? {
          label: t.get($basePath === '/lms' || $basePath === '#' ? 'navigation.goto_lms' : 'navigation.goto_dashboard'),
          href: resolve(`${$basePath !== '#' ? $basePath : '/lms'}`, {})
        }
      : { label: t.get('navigation.login'), href: '/login' }
  );

  const previewProps = $derived(buildOrgLandingPageProps($currentOrg, normalized, [], false, authAction));

  const ThemeComponent = $derived(landingPageThemeComponents[currentTheme] ?? landingPageThemeComponents.minimal);

  const customizeHref = $derived(resolve(`${$currentOrgPath}/settings/landingpage/edit`, {}));

  function handleAddTheme(theme: LandingPageTheme) {
    if ($isFreePlan && isPaidTheme(theme)) {
      openUpgradeModal();
      return;
    }

    goto(resolve(`${$currentOrgPath}/settings/landingpage/edit?theme=${theme}`, {}));
  }

  async function handleApplyTheme(theme: LandingPageTheme) {
    if (!$currentOrg.id) return;

    if ($isFreePlan && isPaidTheme(theme)) {
      openUpgradeModal();
      return;
    }

    const updatedLandingPage = normalizeLandingPageSettings({
      ...normalized,
      theme
    });

    await orgApi.update($currentOrg.id, {
      landingpage: updatedLandingPage as AccountOrg['landingpage']
    });

    normalized = updatedLandingPage;
    snackbar.success('snackbar.success_update');
  }

  function handlePreviewTheme(theme: LandingPageTheme) {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('preview', theme);
    goto(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`, {
      replaceState: false,
      keepFocus: true,
      noScroll: true
    });
  }

  const navCount = $derived(normalized.navItems?.length ?? 0);
  const heroHeading = $derived(normalized.hero?.heading?.trim() || t.get('settings.landing_page.current.hero_empty'));
  const navCountLabel = $derived(
    t.get(
      navCount === 1
        ? 'settings.landing_page.current.field_nav_count_one'
        : 'settings.landing_page.current.field_nav_count_other',
      { count: navCount }
    )
  );

  // Disabled if the current theme is paid and the org is on a free plan (legacy state).
  const customizeLocked = $derived($isFreePlan && isPaidTheme(currentTheme));

  const PREVIEW_RENDER_WIDTH = 1440;
  let previewWidth = $state(0);
  const previewScale = $derived(previewWidth > 0 ? previewWidth / PREVIEW_RENDER_WIDTH : 0.5);
</script>

<div class="w-full space-y-10 px-2 pb-12">
  <section>
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div
        class="ui:border-border bg-background relative aspect-[16/10] w-full overflow-hidden rounded-xl border select-none"
        bind:clientWidth={previewWidth}
      >
        <div
          class="pointer-events-none absolute top-0 left-0 origin-top-left"
          style="width: {PREVIEW_RENDER_WIDTH}px; height: {PREVIEW_RENDER_WIDTH *
            0.625}px; transform: scale({previewScale});"
        >
          {#if $currentOrg.id}
            <ThemeComponent {...previewProps} disableCourseLinks={true} />
          {/if}
        </div>
        <div
          class="from-background pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent"
        ></div>
      </div>

      <Card.Root class="flex flex-col">
        <Card.Header>
          <Card.Title class="text-base">{$t('settings.landing_page.current.title')}</Card.Title>
          <Card.Description>{$t('settings.landing_page.current.description')}</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-3 pb-4">
          <div class="flex items-center justify-between gap-3">
            <span class="ui:text-muted-foreground text-xs tracking-wider uppercase">
              {$t('settings.landing_page.current.field_theme')}
            </span>
            <Badge variant="secondary" class="text-[10px] uppercase">
              {$t(currentThemeCard.titleKey)}
            </Badge>
          </div>
          <div class="flex items-start justify-between gap-3">
            <span class="ui:text-muted-foreground shrink-0 text-xs tracking-wider uppercase">
              {$t('settings.landing_page.current.field_hero')}
            </span>
            <span class="line-clamp-1 text-right text-xs font-medium">{heroHeading}</span>
          </div>
          <div class="flex items-center justify-between gap-3">
            <span class="ui:text-muted-foreground text-xs tracking-wider uppercase">
              {$t('settings.landing_page.current.field_nav')}
            </span>
            <span class="text-xs font-medium">{navCountLabel}</span>
          </div>
        </Card.Content>
        <Card.Footer class="mt-auto">
          <Button
            class="w-full justify-center"
            href={customizeLocked ? undefined : customizeHref}
            disabled={!$currentOrg.id}
            onclick={customizeLocked ? () => openUpgradeModal() : undefined}
          >
            {#if customizeLocked}
              <ZapIcon class="size-4" />
            {/if}
            {$t('settings.landing_page.current.customize')}
            <ArrowRightIcon class="size-4" />
          </Button>
        </Card.Footer>
      </Card.Root>
    </div>
  </section>

  <section>
    <div class="mb-6 flex items-start gap-4">
      <div class="ui:bg-primary/10 ui:text-primary flex size-12 shrink-0 items-center justify-center rounded-lg">
        <LayoutTemplateIcon class="size-6" />
      </div>
      <div>
        <h2 class="text-lg font-semibold">{$t('settings.landing_page.gallery.heading')}</h2>
        <p class="ui:text-muted-foreground text-sm">{$t('settings.landing_page.gallery.description')}</p>
      </div>
    </div>

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each otherThemeCards as themeCard (themeCard.value)}
        {@const isLocked = $isFreePlan && isPaidTheme(themeCard.value)}
        <div class="ui:border-border bg-background relative overflow-hidden rounded-xl border">
          {#if isLocked}
            <div
              class="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white shadow-sm"
            >
              <PremiumIcon size={14} color="white" />
              {$t('settings.landing_page.gallery.upgrade')}
            </div>
          {/if}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger class="absolute top-2 right-2 z-10">
              <IconButton variant="secondary" aria-label={$t('settings.landing_page.gallery.card_menu_label')}>
                <EllipsisVerticalIcon size={16} />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item onclick={() => handlePreviewTheme(themeCard.value)}>
                <EyeIcon size={16} class="mr-2" />
                {$t('settings.landing_page.gallery.preview')}
              </DropdownMenu.Item>
              {#if !isLocked}
                <DropdownMenu.Item onclick={() => handleApplyTheme(themeCard.value)}>
                  <PaintbrushIcon size={16} class="mr-2" />
                  {$t('settings.landing_page.gallery.apply_theme')}
                </DropdownMenu.Item>
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
          <div class="bg-background aspect-[4/3] w-full overflow-hidden">
            <img
              src={themeCard.preview}
              alt={$t(themeCard.titleKey)}
              class="h-full w-full object-cover object-top"
              loading="lazy"
            />
          </div>
          <div class="flex items-center justify-between gap-3 px-4 py-3">
            <div class="min-w-0">
              <p class="ui:text-primary truncate text-sm font-semibold">{$t(themeCard.titleKey)}</p>
              <p class="ui:text-muted-foreground truncate text-xs">
                {$t('settings.landing_page.gallery.by_classroomio')}
              </p>
            </div>
            <Button variant="outline" size="sm" onclick={() => handleAddTheme(themeCard.value)}>
              {$t('settings.landing_page.gallery.add')}
            </Button>
          </div>
        </div>
      {/each}
    </div>
  </section>
</div>

<ThemePreviewDialog />
