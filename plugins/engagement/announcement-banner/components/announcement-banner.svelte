<script lang="ts">
  import { browser } from '$app/environment';
  import { Megaphone, X, ExternalLink, Info, AlertTriangle, CheckCircle } from '@lucide/svelte';

  interface BannerConfig {
    id?: string;
    message?: string;
    variant?: 'info' | 'warning' | 'success';
    linkText?: string;
    linkUrl?: string;
    dismissible?: boolean;
  }

  interface Props {
    config?: BannerConfig;
    [key: string]: any;
  }

  let { config = {} }: Props = $props();

  const bannerId = $derived(config.id ?? 'default-broadcast-v1');
  const message = $derived(
    config.message ?? 'Welcome! Explore newly released courses and interactive training tracks in your academy.'
  );
  const variant = $derived(config.variant ?? 'info');
  const linkText = $derived(config.linkText ?? 'Explore Courses');
  const linkUrl = $derived(config.linkUrl ?? '');
  const dismissible = $derived(config.dismissible ?? true);

  let dismissed = $state(false);

  $effect(() => {
    if (browser) {
      const stored = localStorage.getItem(`cio_dismissed_announcement_${bannerId}`);
      if (stored === 'true') {
        dismissed = true;
      }
    }
  });

  function handleDismiss() {
    dismissed = true;
    if (browser) {
      localStorage.setItem(`cio_dismissed_announcement_${bannerId}`, 'true');
    }
  }

  const variantStyles = $derived.by(() => {
    switch (variant) {
      case 'warning':
        return {
          wrapper: 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200',
          badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
          Icon: AlertTriangle,
          btn: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
      case 'success':
        return {
          wrapper: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
          badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
          Icon: CheckCircle,
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        };
      case 'info':
      default:
        return {
          wrapper: 'bg-primary/10 border-primary/20 text-foreground',
          badge: 'bg-primary/20 text-primary',
          Icon: Megaphone,
          btn: 'bg-primary hover:bg-primary/90 text-primary-foreground'
        };
    }
  });
</script>

{#if !dismissed}
  <aside
    class="relative z-40 w-full border-b px-4 py-2.5 transition-all duration-300 {variantStyles.wrapper}"
    aria-label="Announcement"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 text-sm">
      <div class="flex items-center gap-2.5 overflow-hidden">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full {variantStyles.badge}">
          <variantStyles.Icon class="h-3.5 w-3.5" />
        </span>
        <p class="truncate font-medium">
          {message}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        {#if linkUrl}
          <a
            href={linkUrl}
            class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors {variantStyles.btn}"
          >
            <span>{linkText}</span>
            <ExternalLink class="h-3 w-3" />
          </a>
        {/if}

        {#if dismissible}
          <button
            type="button"
            onclick={handleDismiss}
            class="hover:bg-foreground/10 inline-flex h-7 w-7 items-center justify-center rounded-md text-inherit opacity-70 transition-opacity hover:opacity-100"
            aria-label="Dismiss banner"
          >
            <X class="h-4 w-4" />
          </button>
        {/if}
      </div>
    </div>
  </aside>
{/if}
