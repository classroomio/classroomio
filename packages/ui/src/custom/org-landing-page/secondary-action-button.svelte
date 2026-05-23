<script lang="ts">
  import type { OrgLandingPageTheme } from './types';
  import { Button } from '../../base/button';

  interface Props {
    href: string;
    label: string;
    variant: OrgLandingPageTheme;
  }

  let { href, label, variant }: Props = $props();

  const themeButtonClasses: Record<
    OrgLandingPageTheme,
    {
      className: string;
      variant: 'outline';
    }
  > = {
    minimal: {
      className: 'ui:rounded-full',
      variant: 'outline'
    },
    bold: {
      className:
        'ui:rounded-xl ui:px-8 ui:py-6 ui:text-base ui:font-bold ui:border-2 ui:hover:border-[var(--landing-accent)] ui:transition-all',
      variant: 'outline'
    },
    classic: {
      className:
        'ui:px-8 ui:font-semibold ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)] ui:border-[var(--landing-border)] ui:transition-colors',
      variant: 'outline'
    },
    saas: {
      className:
        'ui:rounded-full ui:px-6 ui:border-[var(--landing-border)] ui:text-[var(--landing-fg)] ui:hover:bg-accent',
      variant: 'outline'
    },
    tech: {
      className:
        'ui:rounded-none ui:px-6 ui:font-semibold ui:border-black ui:text-white ui:bg-black ui:hover:bg-black/80 ui:transition-colors',
      variant: 'outline'
    },
    studio: {
      className:
        'ui:rounded-md ui:px-5 ui:border-[var(--landing-border)] ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)] ui:hover:bg-[var(--landing-card-soft)] ui:transition-colors',
      variant: 'outline'
    },
    corporate: {
      className:
        'ui:rounded-none ui:px-6 ui:font-medium ui:border-[var(--landing-fg)] ui:text-[var(--landing-fg)] ui:hover:bg-[var(--landing-fg)] ui:hover:text-[var(--landing-bg)] ui:transition-colors',
      variant: 'outline'
    },
    terminal: {
      className:
        'ui:rounded-full ui:px-5 ui:font-medium ui:bg-white/5 ui:border-[#262a35] ui:text-[#e9eaed] ui:hover:bg-white/10 ui:transition-colors',
      variant: 'outline'
    },
    editorial: {
      className:
        'ui:rounded-full ui:px-5 ui:font-medium ui:bg-transparent ui:border-[#d9d8d0] ui:text-[#1a1a1a] ui:hover:bg-[#ebeae3] ui:transition-colors',
      variant: 'outline'
    },
    vibrant: {
      className:
        'ui:rounded-md ui:px-6 ui:py-3 ui:text-base ui:font-medium ui:bg-transparent ui:border-[var(--landing-border)] ui:text-[var(--landing-fg)] ui:hover:bg-[var(--landing-card-soft)] ui:transition-colors',
      variant: 'outline'
    }
  };
</script>

<Button {href} variant={themeButtonClasses[variant].variant} size="lg" class={themeButtonClasses[variant].className}>
  {label}
</Button>
