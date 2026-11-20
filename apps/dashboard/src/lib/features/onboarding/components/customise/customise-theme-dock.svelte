<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import CheckIcon from '@lucide/svelte/icons/check';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { cn } from '@cio/ui/tools';
  import { isFreeLandingPageTheme } from '@cio/utils/constants';
  import { t } from '$lib/utils/functions/translations';
  import { landingPageThemes, type LandingPageThemeKey } from '$features/org/utils/landing-page';
  import { themeThumbnailUrl } from '$features/onboarding/utils/customise-theme';

  interface Props {
    selected: LandingPageThemeKey;
    previewing: LandingPageThemeKey | null;
    isLocked: (theme: LandingPageThemeKey) => boolean;
    onPreview: (theme: LandingPageThemeKey) => void;
  }

  let { selected, previewing, isLocked, onPreview }: Props = $props();

  const dockThemes = [
    ...landingPageThemes.filter((theme) => isFreeLandingPageTheme(theme)),
    ...landingPageThemes.filter((theme) => !isFreeLandingPageTheme(theme))
  ];

  let dock = $state<HTMLDivElement | null>(null);
  const brokenThumbnails = new SvelteSet<LandingPageThemeKey>();

  function themeTitle(theme: LandingPageThemeKey) {
    return $t(`settings.landing_page.theme.cards.${theme}.title`);
  }

  function pickLabel(theme: LandingPageThemeKey) {
    if (theme === selected) return $t('onboarding.v2.customise.theme_selected', { theme: themeTitle(theme) });
    if (isLocked(theme)) return $t('onboarding.v2.customise.theme_upgrade', { theme: themeTitle(theme) });

    return $t('onboarding.v2.customise.theme_select', { theme: themeTitle(theme) });
  }

  function tagLabel(theme: LandingPageThemeKey) {
    if (isFreeLandingPageTheme(theme)) return $t('onboarding.v2.customise.theme_free');
    if (isLocked(theme)) return $t('onboarding.v2.customise.theme_premium');

    return $t('onboarding.v2.customise.theme_included');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;

    const options = Array.from(dock?.querySelectorAll<HTMLButtonElement>('[data-theme-pick]') ?? []);
    const index = options.findIndex((option) => option === document.activeElement);
    if (index === -1) return;

    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = options[(index + step + options.length) % options.length];
    next.focus();
    next.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }

  onMount(() => {
    dock?.querySelector('[aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  });
</script>

<div
  bind:this={dock}
  class="flex snap-x snap-proximity gap-3 overflow-x-auto px-6 py-3.5 pb-[18px]"
  role="listbox"
  tabindex="-1"
  aria-label={$t('onboarding.v2.customise.themes_label')}
  data-testid="onboarding-customise-themes"
  onkeydown={handleKeydown}
>
  {#each dockThemes as theme, index (theme)}
    {@const isSelected = theme === selected}
    {@const isPreviewing = theme === previewing}
    {@const locked = isLocked(theme)}
    <div
      role="option"
      aria-selected={isSelected}
      class={cn(
        'dock-tile ui:bg-background w-[156px] flex-none snap-center overflow-hidden rounded-[14px] border transition-colors max-md:w-[124px]',
        isSelected
          ? 'ui:border-primary shadow-[0_0_0_1px_var(--primary)]'
          : isPreviewing
            ? 'ui:border-foreground shadow-[0_0_0_1px_var(--foreground)]'
            : 'ui:hover:border-primary/40'
      )}
      style:--tile-index={index}
    >
      <button
        type="button"
        class="block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ring)]"
        aria-label={pickLabel(theme)}
        data-theme-pick={theme}
        onclick={() => onPreview(theme)}
      >
        <span class="ui:bg-muted relative block aspect-[4/3] w-full overflow-hidden">
          {#if brokenThumbnails.has(theme)}
            <span class="flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
              <span class="text-xs font-semibold">{themeTitle(theme)}</span>
              <span class="ui:text-muted-foreground line-clamp-2 text-[10px] leading-snug">
                {$t(`settings.landing_page.theme.cards.${theme}.description`)}
              </span>
            </span>
          {:else}
            <img
              src={themeThumbnailUrl(theme)}
              alt=""
              loading="lazy"
              class="block size-full object-cover object-top"
              onerror={() => brokenThumbnails.add(theme)}
            />
          {/if}
          <span
            class={cn(
              'ui:bg-background ui:font-brand-mono absolute top-2 left-2 inline-flex items-center gap-[5px] rounded-md border px-2 py-[3px] text-[10px] leading-none font-normal tracking-[0.08em] uppercase',
              locked ? 'text-blue-700' : 'ui:text-foreground'
            )}
          >
            {#if locked}
              <LockIcon class="custom size-2.5" />
            {/if}
            {tagLabel(theme)}
          </span>
          {#if isSelected}
            <span
              class="ui:bg-primary ui:text-primary-foreground absolute top-[7px] right-[7px] grid size-[22px] place-items-center rounded-full"
            >
              <CheckIcon class="custom size-3" />
            </span>
          {/if}
        </span>
        <span class="flex items-center justify-between py-1.5 pr-1.5 pl-2.5 text-[13px]">
          <b class="truncate font-semibold">{themeTitle(theme)}</b>
        </span>
      </button>
    </div>
  {/each}
</div>

<style>
  .dock-tile {
    animation: dock-tile-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
    animation-delay: calc(var(--tile-index, 0) * 70ms);
  }

  @keyframes dock-tile-rise {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dock-tile {
      animation: none;
    }
  }
</style>
