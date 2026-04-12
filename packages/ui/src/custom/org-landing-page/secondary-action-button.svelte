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
    }
  };
</script>

<Button {href} variant={themeButtonClasses[variant].variant} size="lg" class={themeButtonClasses[variant].className}>
  {label}
</Button>
