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
</script>

<EditableLandingSection sectionKey="navigation">
  <header class="ui:flex ui:items-center ui:justify-between ui:gap-6 ui:py-4 ui:text-primary-foreground">
    <a
      href="/"
      class="ui:flex ui:items-center ui:gap-2 ui:font-bold ui:text-base ui:tracking-tight ui:text-primary-foreground ui:no-underline"
    >
      {#if logoUrl}
        <img src={logoUrl} alt={orgName} class="ui:h-7 ui:w-auto" />
      {/if}
      {orgName}
    </a>

    {#if navItems.length > 0}
      <nav class="ui:hidden ui:md:flex ui:gap-1.5 ui:font-mono ui:text-[13px]">
        {#each navItems as item (item.href + item.label)}
          <a
            href={item.href}
            class="ui:px-3 ui:py-1.5 ui:rounded-full ui:border ui:border-transparent ui:text-primary-foreground/85 ui:hover:text-primary-foreground ui:hover:border-primary-foreground/30 ui:hover:bg-primary-foreground/10 ui:transition-colors ui:no-underline"
          >
            ( {item.label.toLowerCase()} )
          </a>
        {/each}
      </nav>
    {/if}

    {#if authAction}
      <Button
        href={authAction.href}
        size="sm"
        variant="outline"
        class="ui:rounded-none ui:font-semibold ui:border-primary-foreground ui:text-primary-foreground ui:bg-transparent ui:hover:bg-primary-foreground/10 ui:hover:text-primary-foreground"
      >
        {authAction.label} →
      </Button>
    {/if}
  </header>
</EditableLandingSection>
