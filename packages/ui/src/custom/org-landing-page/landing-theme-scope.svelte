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
</script>

<div
  class={cn('ui:min-h-screen ui:bg-[var(--landing-bg)] ui:text-[var(--landing-fg)]', className)}
  style={themeStyle(theme)}
>
  {@render children()}
</div>
