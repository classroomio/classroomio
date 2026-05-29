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
  <header
    class="ui:flex ui:items-center ui:justify-between ui:gap-4 ui:py-2 ui:pl-5 ui:pr-2 ui:rounded-full ui:border ui:border-[var(--landing-border)] ui:bg-[var(--landing-bg)]/85 ui:backdrop-blur-md ui:shadow-[0_4px_24px_-8px_rgba(14,14,16,0.08)]"
  >
    <a
      href="/"
      class="ui:flex ui:items-center ui:gap-2 ui:font-semibold ui:text-[15px] ui:tracking-tight ui:text-[var(--landing-fg)] ui:no-underline ui:cursor-pointer"
    >
      {#if logoUrl}
        <img src={logoUrl} alt={orgName} class="ui:h-6 ui:w-auto" />
      {/if}
      {orgName}
    </a>

    {#if navItems.length > 0}
      <nav class="ui:hidden ui:md:flex ui:gap-1">
        {#each navItems as item (item.href + item.label)}
          <a
            href={item.href}
            class="ui:px-3.5 ui:py-1.5 ui:text-sm ui:font-medium ui:text-[var(--landing-fg)]/80 ui:hover:text-[var(--landing-fg)] ui:hover:bg-[var(--landing-card-soft)]/60 ui:rounded-full ui:transition-colors ui:no-underline ui:cursor-pointer"
          >
            {item.label}
          </a>
        {/each}
      </nav>
    {/if}

    <div class="ui:flex ui:items-center ui:gap-1.5">
      {#if authAction}
        <Button href={authAction.href} variant="default" size="sm" class="ui:rounded-full ui:px-4">
          {authAction.label}
        </Button>
      {/if}
    </div>
  </header>
</EditableLandingSection>
