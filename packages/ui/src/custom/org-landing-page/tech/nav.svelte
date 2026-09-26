<script lang="ts">
  import type { LandingNavAuthAction, NavItem, OrgLandingPageProps } from '../types';
  import { safeHref } from '../safe-href';
  import EditableLandingSection from '../editable-section.svelte';
  import LearnerMenu from '../learner-menu.svelte';
  import LandingNavCta from '../landing-nav-cta.svelte';

  interface Props {
    orgName: string;
    logoUrl?: string;
    navItems: NavItem[];
    authAction?: LandingNavAuthAction;
    learnerAccount?: OrgLandingPageProps['learnerAccount'];
  }

  let { orgName, logoUrl, navItems, authAction, learnerAccount }: Props = $props();
</script>

<EditableLandingSection sectionKey="navigation" capPlacement="inside">
  <header class="ui:flex ui:items-center ui:justify-between ui:gap-6 ui:py-4 ui:text-[var(--landing-accent-fg)]">
    <a
      href="/"
      class="ui:flex ui:items-center ui:gap-2 ui:font-bold ui:text-base ui:tracking-tight ui:text-[var(--landing-accent-fg)] ui:no-underline ui:cursor-pointer"
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
            href={safeHref(item.href)}
            class="ui:px-3 ui:py-1.5 ui:rounded-full ui:border ui:border-transparent ui:text-[var(--landing-accent-fg)]/85 ui:hover:text-[var(--landing-accent-fg)] ui:hover:border-[var(--landing-accent-fg)]/30 ui:hover:bg-[var(--landing-accent-fg)]/10 ui:transition-colors ui:no-underline ui:cursor-pointer"
          >
            ( {item.label.toLowerCase()} )
          </a>
        {/each}
      </nav>
    {/if}

    {#if authAction || learnerAccount}
      <div class="ui:flex ui:items-center ui:gap-3">
        {#if authAction}
          <LandingNavCta {authAction} theme="tech" />
        {/if}
        {#if learnerAccount}
          <LearnerMenu account={learnerAccount} {authAction} theme="tech" />
        {/if}
      </div>
    {/if}
  </header>
</EditableLandingSection>
