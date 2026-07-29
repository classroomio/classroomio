<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { OrgLandingPageTheme } from './types';
  import { themeStyle } from './theme-style';
  import { cn } from '../../tools';

  let {
    theme,
    class: className = '',
    children
  }: {
    theme: OrgLandingPageTheme;
    class?: string;
    children: Snippet;
  } = $props();

  $effect(() => {
    const styleStr = themeStyle(theme);
    const root = document.documentElement;

    styleStr
      .split(';')
      .filter(Boolean)
      .forEach((pair) => {
        const [prop, val] = pair.split(':').map((s) => s.trim());
        if (prop && val) root.style.setProperty(prop, val);
      });

    root.setAttribute('data-landing-theme', theme);

    return () => {
      styleStr
        .split(';')
        .filter(Boolean)
        .forEach((pair) => {
          const [prop] = pair.split(':').map((s) => s.trim());
          if (prop) root.style.removeProperty(prop);
        });
      root.removeAttribute('data-landing-theme');
    };
  });
</script>

<div
  class={cn('ui:min-h-screen ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)]', className)}
  style={themeStyle(theme)}
>
  {@render children()}
</div>
