<script lang="ts">
  import type { NavItem } from '../types';
  import { Button } from '../../../base/button';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    orgName: string;
    logoUrl?: string;
    navItems: NavItem[];
    authAction?: {
      label: string;
      href: string;
    };
  }

  let { orgName, logoUrl, navItems, authAction }: Props = $props();

  const navigationGradientBackground = `
    linear-gradient(
      135deg,
      color-mix(in oklab, var(--primary) 16%, var(--background)) 0%,
      color-mix(in oklab, var(--primary) 8%, var(--background)) 100%
    )
  `;
</script>

<EditableLandingSection sectionKey="navigation">
  <header
    class="ui:flex ui:items-center ui:justify-between ui:gap-6 ui:px-6 ui:py-4 ui:rounded-full ui:border ui:border-border/60 ui:backdrop-blur-sm"
    style={`background: ${navigationGradientBackground};`}
  >
    <a href="/" class="ui:font-semibold ui:text-xl ui:flex ui:items-center ui:gap-2 ui:no-underline">
      {#if logoUrl}
        <img src={logoUrl} alt={orgName} class="ui:h-8 ui:w-auto" />
      {/if}
      {orgName}
    </a>
    <div class="ui:flex ui:items-center ui:gap-4">
      <nav class="ui:hidden ui:md:flex ui:gap-8">
        {#each navItems as item}
          <a href={item.href} class="ui:text-sm ui:text-foreground/70 ui:hover:text-foreground ui:transition-colors"
            >{item.label}</a
          >
        {/each}
      </nav>
      {#if authAction}
        <Button href={authAction.href} variant="outline" class="ui:rounded-full">
          {authAction.label}
        </Button>
      {/if}
    </div>
  </header>
</EditableLandingSection>
