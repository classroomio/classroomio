<script lang="ts">
  import { Popover as PopoverPrimitive } from 'bits-ui';
  import { tick } from 'svelte';
  import type { LandingLearnerAccount, LandingNavAuthAction, OrgLandingPageTheme } from './types';
  import { themeStyle } from './theme-style';
  import LandingButton from './landing-button.svelte';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import AwardIcon from '@lucide/svelte/icons/award';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import SunIcon from '@lucide/svelte/icons/sun';
  import MoonIcon from '@lucide/svelte/icons/moon';
  import MonitorIcon from '@lucide/svelte/icons/monitor';
  import { setMode, userPrefersMode } from '../../base/dark-mode';

  interface Props {
    account?: LandingLearnerAccount;
    authAction?: LandingNavAuthAction;
    theme: OrgLandingPageTheme;
    class?: string;
  }

  let { account, authAction, theme, class: className = '' }: Props = $props();

  let open = $state(false);
  let focusedLinkIndex = $state(0);
  let triggerButtonEl = $state<HTMLButtonElement | null>(null);
  let contentEl = $state<HTMLElement | null>(null);
  let failedAvatarUrl = $state<string | null>(null);
  const hasAvatarError = $derived(Boolean(account?.avatarUrl && failedAvatarUrl === account.avatarUrl));

  function getInitials(name: string | null | undefined, email: string | null | undefined): string {
    const source = (name?.trim() || email || '?').split(/\s+/).filter(Boolean);
    return source
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  const activeThemeMode = $derived(userPrefersMode.current ?? 'light');

  const themeOptions = $derived([
    { mode: 'light' as const, label: account?.themeModeLabels?.light ?? 'Light', icon: SunIcon },
    { mode: 'dark' as const, label: account?.themeModeLabels?.dark ?? 'Dark', icon: MoonIcon },
    { mode: 'system' as const, label: account?.themeModeLabels?.system ?? 'System', icon: MonitorIcon }
  ]);

  function handleThemeSelect(mode: 'light' | 'dark' | 'system') {
    setMode(mode);
    account?.onThemeChange?.(mode);
  }

  // Helper to query all focusable elements per zone inside contentEl
  function getZoneElements() {
    if (!contentEl) return { linkEls: [], themeEls: [], ctaEl: null };

    // Zone 1: learner destinations + logout
    const linkEls = Array.from(contentEl.querySelectorAll<HTMLElement>('a[data-slot="lm-link"]'));
    const themeEls = Array.from(contentEl.querySelectorAll<HTMLButtonElement>('button[role="radio"]'));

    // Find CTA: either the element with data-slot="lm-cta" or the button/link inside it
    const ctaContainer = contentEl.querySelector('[data-slot="lm-cta"]');
    const ctaEl = ctaContainer?.matches('a, button')
      ? (ctaContainer as HTMLElement)
      : (ctaContainer?.querySelector<HTMLElement>('a, button') ?? (ctaContainer as HTMLElement | null));

    return { linkEls, themeEls, ctaEl };
  }

  function getActiveRadio(themeEls: HTMLButtonElement[]): HTMLElement | null {
    return (
      themeEls.find((el) => el.getAttribute('aria-checked') === 'true') ??
      themeEls.find((el) => el.tabIndex === 0) ??
      themeEls[0] ??
      null
    );
  }

  function handleContentKeydown(event: KeyboardEvent) {
    const { linkEls, themeEls, ctaEl } = getZoneElements();
    const active = document.activeElement;

    const isActive = (el: HTMLElement) => el === active || el.contains(active);

    // Check for active zone
    const activeItem = linkEls.find(isActive);
    const inZone1 = Boolean(activeItem);
    const inZone2 = themeEls.some(isActive);
    const inZone3 = Boolean(ctaEl && isActive(ctaEl));

    // 1. Zone 1 Roving Tabindex (Arrow Keys + Home/End)
    if (inZone1) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        const currentIndex = linkEls.indexOf(activeItem!);
        const nextIndex =
          event.key === 'ArrowDown'
            ? (currentIndex + 1) % linkEls.length
            : (currentIndex - 1 + linkEls.length) % linkEls.length;
        focusedLinkIndex = nextIndex;
        linkEls[nextIndex]?.focus();
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        event.stopPropagation();
        focusedLinkIndex = 0;
        linkEls[0]?.focus();
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        event.stopPropagation();
        focusedLinkIndex = linkEls.length - 1;
        linkEls[focusedLinkIndex]?.focus();
        return;
      }
    }

    // 2. Zone 2 Theme Segmented Control (Arrow Keys)
    if (inZone2) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        const currentIndex = themeEls.findIndex(isActive);
        const nextIndex = (currentIndex + 1) % themeEls.length;
        handleThemeSelect(themeOptions[nextIndex].mode);
        themeEls[nextIndex]?.focus();
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        const currentIndex = themeEls.findIndex(isActive);
        const nextIndex = (currentIndex - 1 + themeEls.length) % themeEls.length;
        handleThemeSelect(themeOptions[nextIndex].mode);
        themeEls[nextIndex]?.focus();
        return;
      }
    }

    // 3. Tab & Shift+Tab zone navigation (Zone 1 -> Zone 2 -> Zone 3)
    if (event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();

      const activeRadio = getActiveRadio(themeEls);
      const targetZone1 = linkEls[focusedLinkIndex] ?? linkEls[0];

      if (event.shiftKey) {
        // Shift + Tab: Backwards
        if (inZone3) {
          activeRadio?.focus();
        } else if (inZone2) {
          targetZone1?.focus();
        } else if (inZone1) {
          if (ctaEl) {
            ctaEl.focus();
          } else {
            activeRadio?.focus();
          }
        } else {
          // If focus somehow got lost outside the zones
          targetZone1?.focus();
        }
      } else {
        // Tab: Forwards
        if (inZone1) {
          activeRadio?.focus();
        } else if (inZone2) {
          if (ctaEl) {
            ctaEl.focus();
          } else {
            targetZone1?.focus();
          }
        } else if (inZone3) {
          targetZone1?.focus();
        } else {
          // If focus somehow got lost outside the zones
          targetZone1?.focus();
        }
      }
    }
  }

  async function handleOpenChange(isOpen: boolean) {
    open = isOpen;
    if (isOpen) {
      focusedLinkIndex = 0;
      try {
        await tick();
      } catch {
        return;
      }

      // Double rAF guarantees the popover portal has mounted and rendered into the DOM
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const { linkEls } = getZoneElements();
          linkEls[0]?.focus();
        });
      });
    }
  }
</script>

{#snippet learnerAvatar()}
  {#if account?.avatarUrl && !hasAvatarError}
    <img
      src={account.avatarUrl}
      alt=""
      class="ui:size-8 ui:rounded-full ui:object-cover ui:block"
      onerror={() => (failedAvatarUrl = account?.avatarUrl ?? null)}
    />
  {:else}
    <span
      class="ui:size-8 ui:rounded-full ui:bg-(--landing-card-soft) ui:border ui:border-(--landing-border) ui:grid ui:place-items-center ui:text-(--landing-fg-muted) ui:text-xs ui:font-semibold"
    >
      {getInitials(account?.fullname, account?.email)}
    </span>
  {/if}
{/snippet}

{#if !account}
  <!-- FR-1 / AC-1 Logged-out state -->
{:else if account.loading}
  <!-- FR-1 Loading state -->
  <span
    class="ui:size-8 ui:rounded-full ui:bg-(--landing-border-soft) ui:animate-pulse ui:block {className}"
    aria-hidden="true"
    data-testid="landing-learner-skeleton"
  ></span>
{:else if account.inert}
  <!-- FR-5 Settings preview inert state -->
  <span
    class="ui:size-8 ui:p-0 ui:rounded-full ui:border ui:border-transparent ui:bg-transparent ui:grid ui:place-items-center ui:select-none {className}"
    aria-hidden="true"
    data-testid="landing-learner-inert"
  >
    {@render learnerAvatar()}
  </span>
{:else}
  <!-- Active state: Popover with trigger button -->
  <PopoverPrimitive.Root bind:open onOpenChange={handleOpenChange}>
    <PopoverPrimitive.Trigger
      bind:ref={triggerButtonEl}
      type="button"
      aria-haspopup="dialog"
      aria-label={account.triggerLabel}
      class="ui:size-8 ui:p-0 ui:rounded-full ui:border ui:border-transparent ui:bg-transparent ui:grid ui:place-items-center ui:cursor-pointer ui:transition-[border-color,box-shadow] ui:duration-150 ui:hover:border-[var(--landing-border)] ui:hover:shadow-[0_0_0_3px_color-mix(in_oklab,var(--landing-fg)_8%,transparent)] ui:focus-visible:outline-none ui:focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--landing-accent)_45%,transparent)] ui:data-[state=open]:border-[var(--landing-border)] ui:data-[state=open]:shadow-[0_0_0_3px_color-mix(in_oklab,var(--landing-fg)_8%,transparent)] {className}"
    >
      {@render learnerAvatar()}
    </PopoverPrimitive.Trigger>

    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        bind:ref={contentEl}
        align="end"
        sideOffset={8}
        role="dialog"
        aria-label={account.triggerLabel}
        class="ui:z-80 ui:w-[280px] ui:max-w-[calc(100vw-32px)] ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:rounded-[var(--landing-radius-card)] ui:shadow-[var(--landing-shadow-card)] ui:p-1.5 ui:text-[var(--landing-fg)] ui:outline-none ui:transition-[opacity,transform] ui:duration-150"
        style={themeStyle(theme)}
        onkeydowncapture={handleContentKeydown}
      >
        <!-- Identity block (presentational, aria-hidden per FR-2) -->
        <div class="ui:px-2.5 ui:pt-2.5 ui:pb-3" aria-hidden="true">
          {#if account.fullname}
            <div class="ui:text-[15px] ui:font-semibold ui:text-[var(--landing-fg)] ui:tracking-tight ui:truncate">
              {account.fullname}
            </div>
            {#if account.email}
              <div class="ui:text-[13px] ui:text-[var(--landing-fg-muted)] ui:truncate">
                {account.email}
              </div>
            {/if}
          {:else if account.email}
            <div class="ui:text-[15px] ui:font-semibold ui:text-[var(--landing-fg)] ui:tracking-tight ui:truncate">
              {account.email}
            </div>
          {/if}
        </div>

        <!-- Divider -->
        <div
          class="ui:h-0 ui:border-t ui:my-1 ui:-mx-1.5"
          role="separator"
          aria-orientation="horizontal"
          style="border-top: var(--landing-divider);"
        ></div>

        <!-- Zone 1: Learner Destinations -->
        {#each account.items as item, index (item.key)}
          <a
            href={item.href || '#'}
            data-slot="lm-link"
            tabindex={focusedLinkIndex === index ? 0 : -1}
            onfocus={() => (focusedLinkIndex = index)}
            class="ui:flex ui:items-center ui:justify-between ui:gap-2.5 ui:h-9 ui:px-2.5 ui:rounded-[calc(var(--landing-radius-card)+4px)] ui:text-sm ui:text-[var(--landing-fg)] ui:w-full ui:bg-transparent ui:no-underline ui:transition-colors ui:duration-120 ui:hover:bg-[var(--landing-button-tertiary-bg-hover)] ui:focus-visible:outline-none ui:focus-visible:bg-[var(--landing-button-tertiary-bg-hover)] ui:focus-visible:shadow-[inset_0_0_0_2px_color-mix(in_oklab,var(--landing-accent)_40%,transparent)]"
            onclick={() => (open = false)}
          >
            <span>{item.label}</span>
            {#if item.key === 'myCourses'}
              <BookOpenIcon class="ui:size-[15px] ui:text-[var(--landing-fg-muted)] ui:shrink-0" aria-hidden="true" />
            {:else if item.key === 'myCertificates'}
              <AwardIcon class="ui:size-[15px] ui:text-[var(--landing-fg-muted)] ui:shrink-0" aria-hidden="true" />
            {:else if item.key === 'accountSettings'}
              <SettingsIcon class="ui:size-[15px] ui:text-[var(--landing-fg-muted)] ui:shrink-0" aria-hidden="true" />
            {/if}
          </a>
        {/each}

        <!-- Divider -->
        <div
          class="ui:h-0 ui:border-t ui:my-1 ui:-mx-1.5"
          role="separator"
          aria-orientation="horizontal"
          style="border-top: var(--landing-divider);"
        ></div>

        <!-- Zone 2: Theme Segmented Control -->
        <div class="ui:flex ui:items-center ui:justify-between ui:gap-2.5 ui:px-2.5 ui:py-1.5 ui:text-sm">
          <span>{account.themeLabel}</span>
          <div
            class="ui:flex ui:items-center ui:gap-0.5 ui:p-0.5 ui:border ui:border-[var(--landing-border)] ui:rounded-full ui:bg-[var(--landing-card-soft)]"
            role="radiogroup"
            aria-label={account.themeLabel}
          >
            {#each themeOptions as opt (opt.mode)}
              <button
                type="button"
                role="radio"
                aria-checked={activeThemeMode === opt.mode}
                tabindex={activeThemeMode === opt.mode ? 0 : -1}
                title={opt.label}
                class="ui:size-[26px] ui:grid ui:place-items-center ui:border-none ui:bg-transparent ui:rounded-full ui:cursor-pointer ui:transition-colors ui:duration-120 ui:text-[var(--landing-fg-muted)] ui:hover:text-[var(--landing-fg)] ui:aria-checked:bg-[var(--landing-card)] ui:aria-checked:text-[var(--landing-fg)] ui:aria-checked:shadow-[0_1px_2px_rgba(0,0,0,0.18)] ui:focus-visible:outline-none ui:focus-visible:ring-1 ui:focus-visible:ring-[var(--landing-accent)]"
                onclick={(e) => {
                  e.stopPropagation();
                  handleThemeSelect(opt.mode);
                }}
              >
                <opt.icon class="ui:size-[15px]" aria-hidden="true" />
              </button>
            {/each}
          </div>
        </div>

        <!-- Divider -->
        <div
          class="ui:h-0 ui:border-t ui:my-1 ui:-mx-1.5"
          role="separator"
          aria-orientation="horizontal"
          style="border-top: var(--landing-divider);"
        ></div>

        <!-- Zone 1 continuation: Log Out item -->
        <a
          href={account.logoutHref || '#'}
          data-slot="lm-link"
          tabindex={focusedLinkIndex === account.items.length ? 0 : -1}
          onfocus={() => (focusedLinkIndex = account.items.length)}
          class="ui:flex ui:items-center ui:justify-between ui:gap-2.5 ui:h-9 ui:px-2.5 ui:rounded-[calc(var(--landing-radius-card)+4px)] ui:text-sm ui:text-[var(--landing-fg)] ui:w-full ui:bg-transparent ui:no-underline ui:transition-colors ui:duration-120 ui:hover:bg-[var(--landing-button-tertiary-bg-hover)] ui:focus-visible:outline-none ui:focus-visible:bg-[var(--landing-button-tertiary-bg-hover)] ui:focus-visible:shadow-[inset_0_0_0_2px_color-mix(in_oklab,var(--landing-accent)_40%,transparent)]"
          onclick={() => (open = false)}
        >
          <span>{account.logoutLabel}</span>
          <LogOutIcon class="ui:size-[15px] ui:text-[var(--landing-fg-muted)] ui:shrink-0" aria-hidden="true" />
        </a>

        <!-- Non-member enrollment note if present -->
        {#if account.note}
          <div class="ui:px-2.5 ui:pt-1.5 ui:pb-2 ui:text-xs ui:text-[var(--landing-fg-faint)] ui:leading-[1.4]">
            {account.note}
          </div>
        {/if}

        <!-- Zone 3: CTA Button (Continue Learning / Join Academy) -->
        {#if authAction}
          <div class="ui:px-1 ui:pt-1.5 ui:pb-1">
            <LandingButton
              variant="primary"
              href={authAction.href}
              disabled={authAction.disabled}
              loading={authAction.loading}
              class="ui:w-full ui:justify-center"
              data-slot="lm-cta"
              onclick={() => (open = false)}
            >
              {authAction.label}
            </LandingButton>
          </div>
        {/if}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  </PopoverPrimitive.Root>
{/if}
