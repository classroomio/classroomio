<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { SvelteURLSearchParams } from 'svelte/reactivity';
  import { currentOrg, currentOrgPath, isFreePlan } from '$lib/utils/store/org';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import * as RadioGroup from '@cio/ui/base/radio-group';
  import { UnsavedChanges } from '$features/ui';
  import { orgApi } from '$features/org/api/org.svelte';
  import {
    createDefaultLandingPageSettings,
    landingPageThemes,
    normalizeLandingPageSettings
  } from '$features/org/utils/landing-page';
  import { landingPageSettings } from '../utils/store';
  import { PremiumIcon } from '@cio/ui/custom/moving-icons';
  import type { AccountOrg } from '$features/app/types';

  let hasInitialized = $state(false);
  let skipUnsavedPrompt = $state(false);
  let { hasUnsavedChanges = $bindable(false) }: { hasUnsavedChanges?: boolean } = $props();

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
    }
  ] as const;

  function isPaidTheme(theme: string): boolean {
    return theme !== 'minimal';
  }

  function selectTheme(theme: (typeof landingPageThemes)[number]) {
    if ($isFreePlan && isPaidTheme(theme)) {
      openUpgradeModal();
      return;
    }

    $landingPageSettings.theme = theme;
    hasUnsavedChanges = true;
  }

  function isLandingPageTheme(value: string | null): value is (typeof landingPageThemes)[number] {
    return value === 'minimal' || value === 'bold' || value === 'classic';
  }

  function getEditContentUrl() {
    const query = new SvelteURLSearchParams(page.url.searchParams);
    query.set('theme', $landingPageSettings.theme);
    return `${$currentOrgPath}/settings/landingpage/edit?${query.toString()}`;
  }

  $effect(() => {
    if (hasInitialized || !$currentOrg.id) {
      return;
    }

    const normalizedLandingPage = normalizeLandingPageSettings($currentOrg.landingpage);
    const orgDefaultLandingPageSettings = createDefaultLandingPageSettings();
    const queryTheme = page.url.searchParams.get('theme');
    $landingPageSettings = {
      ...orgDefaultLandingPageSettings,
      ...normalizedLandingPage
    };
    if (isLandingPageTheme(queryTheme)) {
      $landingPageSettings.theme = queryTheme;
      hasUnsavedChanges = queryTheme !== normalizedLandingPage.theme;
    } else {
      hasUnsavedChanges = false;
    }
    hasInitialized = true;
  });

  export async function handleSave() {
    const updatedLandingPage = normalizeLandingPageSettings($landingPageSettings as AccountOrg['landingpage']);

    await orgApi.update($currentOrg.id, {
      landingpage: updatedLandingPage as AccountOrg['landingpage']
    });

    if (orgApi.success) {
      $landingPageSettings = updatedLandingPage;
      $currentOrg.landingpage = updatedLandingPage as AccountOrg['landingpage'];
      hasUnsavedChanges = false;
    }
  }
</script>

<UnsavedChanges bind:hasUnsavedChanges skipPrompt={skipUnsavedPrompt} />

<Field.Group class="w-full px-2">
  <Field.Set>
    <div class="flex items-start justify-between gap-4">
      <div>
        <Field.Legend>{$t('settings.landing_page.theme.heading')}</Field.Legend>
        <Field.Description>{$t('settings.landing_page.theme.description')}</Field.Description>
      </div>

      <Button
        variant="outline"
        onclick={async () => {
          skipUnsavedPrompt = true;

          try {
            await goto(resolve(getEditContentUrl(), {}));
          } finally {
            skipUnsavedPrompt = false;
          }
        }}
      >
        {$t('settings.landing_page.content.edit')}
      </Button>
    </div>

    <Field.Field>
      <RadioGroup.Root
        bind:value={$landingPageSettings.theme}
        class="grid gap-4 md:grid-cols-3"
        onValueChange={() => {
          hasUnsavedChanges = true;
        }}
      >
        {#each themeCards as themeCard (themeCard.value)}
          {@const isLocked = $isFreePlan && isPaidTheme(themeCard.value)}
          <RadioGroup.Item value={themeCard.value} id={themeCard.value} class="sr-only" />
          <button
            type="button"
            onclick={() => selectTheme(themeCard.value)}
            aria-pressed={$landingPageSettings.theme === themeCard.value}
            class={`group relative cursor-pointer rounded-xl border transition ${
              isLocked
                ? 'border-border opacity-75 hover:border-blue-500/60'
                : $landingPageSettings.theme === themeCard.value
                  ? 'border-primary ring-primary/20 ring-2'
                  : 'border-border hover:border-primary/60'
            }`}
          >
            {#if isLocked}
              <div
                class="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white shadow-sm"
              >
                <PremiumIcon size={14} color="white" />
                Upgrade
              </div>
            {/if}
            <div class="bg-background mb-4 overflow-hidden rounded-t-xl">
              <img src={themeCard.preview} alt={$t(themeCard.titleKey)} class="h-50 w-full object-cover object-top" />
            </div>
            <div class="space-y-1 px-2 pb-2">
              <p class="text-base font-semibold">{$t(themeCard.titleKey)}</p>
              <p class="ui:text-muted-foreground h-[40px] text-sm">{$t(themeCard.descriptionKey)}</p>
            </div>
          </button>
        {/each}
      </RadioGroup.Root>
    </Field.Field>
  </Field.Set>
</Field.Group>
