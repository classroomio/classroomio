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
  <header class="ui:bg-[var(--landing-fg)] ui:text-[var(--landing-bg)]">
    <div class="ui:flex ui:items-center ui:justify-between ui:px-6 ui:lg:px-8 ui:h-20 ui:max-w-7xl ui:mx-auto">
      <a
        href="/"
        class="ui:flex ui:items-center ui:gap-3 ui:text-xl ui:font-bold ui:tracking-wide ui:no-underline ui:cursor-pointer"
      >
        {#if logoUrl}
          <img src={logoUrl} alt={orgName} class="ui:h-8 ui:w-auto" />
        {/if}
        {orgName}
      </a>
      <div class="ui:flex ui:items-center ui:gap-4">
        <nav class="ui:hidden ui:md:flex ui:space-x-8">
          {#each navItems as item}
            <a
              href={item.href}
              class="ui:text-sm ui:font-medium ui:text-[var(--landing-bg)]/70 ui:hover:text-[var(--landing-bg)] ui:transition-colors ui:cursor-pointer"
              >{item.label}</a
            >
          {/each}
        </nav>
        {#if authAction}
          <Button
            href={authAction.href}
            variant="outline"
            class="ui:bg-transparent ui:text-[var(--landing-bg)] ui:border-[var(--landing-bg)]/40 ui:hover:bg-[var(--landing-bg)]/10 ui:hover:text-[var(--landing-bg)] ui:hover:border-[var(--landing-bg)]/60"
          >
            {authAction.label}
          </Button>
        {/if}
      </div>
    </div>
  </header>
</EditableLandingSection>
