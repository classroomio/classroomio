<script lang="ts">
  import type { LandingNavAuthAction, OrgLandingPageTheme } from './types';
  import LandingButton from './landing-button.svelte';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

  interface Props {
    authAction: LandingNavAuthAction;
    theme: OrgLandingPageTheme;
  }

  let { authAction, theme }: Props = $props();

  const themeNavCta: Record<
    OrgLandingPageTheme,
    { variant: 'primary' | 'secondary'; className: string; trailing: 'icon' | 'char' }
  > = {
    minimal: { variant: 'secondary', className: 'ui:rounded-full', trailing: 'icon' },
    bold: { variant: 'secondary', className: 'ui:rounded-xl ui:font-bold', trailing: 'icon' },
    classic: {
      variant: 'secondary',
      className:
        'ui:bg-transparent ui:text-[var(--landing-bg)] ui:border-[var(--landing-bg)]/40 ui:hover:bg-[var(--landing-bg)]/10 ui:hover:text-[var(--landing-bg)] ui:hover:border-[var(--landing-bg)]/60',
      trailing: 'icon'
    },
    saas: { variant: 'primary', className: 'ui:rounded-full ui:px-4', trailing: 'icon' },
    tech: { variant: 'secondary', className: 'ui:rounded-none ui:font-semibold', trailing: 'char' },
    studio: { variant: 'primary', className: 'ui:rounded-md ui:px-3.5', trailing: 'icon' },
    corporate: { variant: 'primary', className: 'ui:rounded-none ui:px-4 ui:font-medium', trailing: 'icon' },
    terminal: { variant: 'secondary', className: 'ui:rounded-full ui:px-4 ui:font-medium', trailing: 'icon' },
    editorial: { variant: 'primary', className: 'ui:rounded-full ui:px-4 ui:font-medium', trailing: 'icon' },
    vibrant: { variant: 'primary', className: 'ui:rounded-md ui:px-4 ui:font-medium', trailing: 'icon' },
    quartz: { variant: 'primary', className: '', trailing: 'icon' }
  };

  const config = $derived(themeNavCta[theme]);
</script>

<LandingButton
  variant={config.variant}
  size="sm"
  href={authAction.href}
  loading={authAction.loading}
  disabled={authAction.disabled}
  class={config.className}
  aria-label={authAction.label}
>
  {#if config.trailing === 'char'}
    <span class="ui:hidden ui:md:inline">{authAction.label} </span>→
  {:else}
    <span class="ui:hidden ui:md:inline">{authAction.label}</span>
    <ArrowRightIcon class="ui:size-3.5 custom" aria-hidden="true" />
  {/if}
</LandingButton>
