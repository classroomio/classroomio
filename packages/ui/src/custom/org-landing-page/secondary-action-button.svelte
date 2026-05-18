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
        'ui:rounded-xl ui:px-8 ui:py-6 ui:text-base ui:font-bold ui:border-2 ui:hover:border-primary ui:transition-all',
      variant: 'outline'
    },
    classic: {
      className: 'ui:px-8 ui:font-semibold ui:bg-background ui:text-foreground ui:border-border ui:transition-colors',
      variant: 'outline'
    },
    saas: {
      className: 'ui:rounded-full ui:px-6 ui:border-border ui:text-foreground ui:hover:bg-accent',
      variant: 'outline'
    },
    tech: {
      className:
        'ui:rounded-none ui:px-6 ui:font-semibold ui:border-black ui:text-white ui:bg-black ui:hover:bg-black/80 ui:transition-colors',
      variant: 'outline'
    },
    studio: {
      className:
        'ui:rounded-md ui:px-5 ui:border-border ui:bg-background ui:text-foreground ui:hover:bg-muted ui:transition-colors',
      variant: 'outline'
    },
    corporate: {
      className:
        'ui:rounded-none ui:px-6 ui:font-medium ui:border-foreground ui:text-foreground ui:hover:bg-foreground ui:hover:text-background ui:transition-colors',
      variant: 'outline'
    },
    terminal: {
      className:
        'ui:rounded-full ui:px-5 ui:font-medium ui:bg-white/5 ui:border-[#262a35] ui:text-[#e9eaed] ui:hover:bg-white/10 ui:transition-colors',
      variant: 'outline'
    }
  };
</script>

<Button {href} variant={themeButtonClasses[variant].variant} size="lg" class={themeButtonClasses[variant].className}>
  {label}
</Button>
